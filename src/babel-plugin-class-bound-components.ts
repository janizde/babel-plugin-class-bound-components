import { Visitor } from '@babel/traverse';
import * as t from '@babel/types';

type BabelTypes = typeof t;

export default function (babelTypes: { types: BabelTypes }) {
  return {
    name: 'class-bound-components',
    visitor: makeRootVisitor(babelTypes.types),
  };
}

type Options = {
  displayName?: boolean;
  elementType?: boolean;
};

type State = {
  classBoundSpecifier: string | null;
  extendSpecifier: string | null;
};

const reservedMethods = ['extend', 'withOptions', 'withVariants', 'as'];

function makeRootVisitor(t: BabelTypes): Visitor {
  const importClassBoundVisitor: Visitor<{ opts: Options }> = {
    ImportDeclaration(path, state) {
      if (path.node.source.value !== 'class-bound-components') {
        return;
      }

      // Symbol of the classBound function
      const defaultImportLocal = path.node.specifiers.find(
        (s) => s.type === 'ImportDefaultSpecifier'
      )?.local.name;

      // Symbol of the standalone extend function
      const extendImportLocal = path.node.specifiers.find(
        (s) => s.type === 'ImportSpecifier' && s.imported.name === 'extend'
      )?.local.name;

      const traverseProgramWith = (visitor: Visitor<State>) =>
        path.parentPath.traverse(visitor, {
          classBoundSpecifier: defaultImportLocal || null,
          extendSpecifier: extendImportLocal || null,
        });

      if (state.opts.displayName ?? true) {
        traverseProgramWith(displayNameVisitor);
      }

      if (state.opts.elementType ?? true) {
        traverseProgramWith(elementTypeVisitor);
      }
    },
  };

  /**
   * Visits all `CallExpression`s and searches for calls of the `classBound` (or as whatever
   * symbol it is imported in the current module), `classBound.extend` or `extend` functions and tries
   * to explicitly add a `displayName` argument. The display name is taken from the corresponding
   * `VariableDeclaration` if possible.
   */
  const displayNameVisitor: Visitor<State> = {
    CallExpression(path) {
      const {
        node: { callee },
      } = path;

      const getImplicitDisplayName = (node: t.Node): string | null => {
        return node.type === 'VariableDeclarator' &&
          node.id.type === 'Identifier'
          ? node.id.name
          : null;
      };

      const isClassBoundCall = () => {
        if (
          callee.type === 'Identifier' &&
          callee.name === this.classBoundSpecifier
        ) {
          return true;
        }

        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === this.classBoundSpecifier
        ) {
          const propertyName = getStaticExpressionValue(
            callee.property as t.Expression
          );
          return !!propertyName && reservedMethods.indexOf(propertyName) < 0;
        }

        return false;
      };

      if (this.classBoundSpecifier && isClassBoundCall()) {
        const displayName = getImplicitDisplayName(path.parent);

        if (displayName) {
          addDisplayNameToClassBound(path.node, displayName);
        }
      } else if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === this.classBoundSpecifier
      ) {
        const displayName = getImplicitDisplayName(path.parent);
        const propertyName = getStaticExpressionValue(
          callee.property as t.Expression
        );

        if (propertyName === 'extend' && displayName) {
          addDisplayNameToExtend(path.node, displayName);
        }
      } else if (
        this.extendSpecifier &&
        callee.type === 'Identifier' &&
        callee.name === this.extendSpecifier
      ) {
        const displayName = getImplicitDisplayName(path.parent);

        if (displayName) {
          addDisplayNameToExtend(path.node, displayName);
        }
      }
    },
  };

  /**
   * Visits all `CallExpression`s and searches for calls of the `classBound` function (or as whatever
   * symbol it is imported in the current module) and tries to replace a proxy member access of
   * `classBound[IntrinsicElement]()` with an explicit `elementType` argument.
   */
  const elementTypeVisitor: Visitor<State> = {
    CallExpression(path) {
      const {
        node: { callee },
      } = path;

      if (
        this.classBoundSpecifier &&
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === this.classBoundSpecifier
      ) {
        // Try to get the property name from Identifier, StringLiteral, TemplateLiteral etc.
        const propertyValue = getStaticExpressionValue(
          callee.property as t.Expression
        );

        if (propertyValue && reservedMethods.indexOf(propertyValue) < 0) {
          inlineElementType(path.node, propertyValue);
          path.node.callee = t.identifier(this.classBoundSpecifier);
        }
      }
    },
  };

  const safeNonObjectTypes: Array<t.Expression['type']> = [
    'StringLiteral',
    'TemplateLiteral',
    'BinaryExpression',
  ];

  const allowedFirstArgumentTypes: Array<t.Expression['type']> = [
    ...safeNonObjectTypes,
    'ArrayExpression',
  ];

  const addDisplayNameToExtend = (
    call: t.CallExpression,
    displayName: string
  ) => {
    // When there's more than 3 arguments, it has to be the full signature
    if (call.arguments.length > 3) {
      return;
    }

    if (
      // Can safely add the third argument
      call.arguments.length < 3 ||
      // Third argument has to be variants
      (call.arguments.length === 3 &&
        call.arguments[2].type === 'ObjectExpression')
    ) {
      for (let i = 0; i < 2; ++i) {
        if (call.arguments[i] === undefined) {
          call.arguments[i] = t.nullLiteral();
        }
      }

      call.arguments.splice(2, 0, t.stringLiteral(displayName));
    }
  };

  /**
   * Given a `classBound` call expression, adds an explicit displayName argument if possible
   */
  const addDisplayNameToClassBound = (
    call: t.CallExpression,
    displayName: string | null
  ) => {
    if (
      call.arguments.length === 1 &&
      call.arguments[0].type === 'ObjectExpression'
    ) {
      transformOptionsSignature(call.arguments[0], displayName);
      return;
    }

    if (
      call.arguments.length > 0 &&
      (allowedFirstArgumentTypes as Array<string>).includes(
        call.arguments[0].type
      )
    ) {
      transformPositionalSignatures(call, displayName);
      return;
    }
  };

  const allowedObjectPropertyTypes: Array<
    t.ObjectExpression['properties'][0]['type']
  > = ['ObjectMethod', 'ObjectProperty'];

  /**
   * Given an object expression representing a `classBound` options object, adds a `displayName` property.
   * `displayName` is only added when it's clear that it's not already present. E.g., when spreading another
   * object into the options object, we can't be sure a `displayName` is not already provided.
   */
  const transformOptionsSignature = (
    objectExpression: t.ObjectExpression,
    displayName: string | null
  ) => {
    if (displayName) {
      if (
        !objectExpression.properties.every((p) =>
          allowedObjectPropertyTypes.includes(p.type)
        )
      ) {
        return;
      }

      const properties = objectExpression.properties as Array<
        t.ObjectMethod | t.ObjectProperty
      >;

      if (properties.some((p) => isStaticObjectKey(p.key, 'displayName'))) {
        return;
      }

      objectExpression.properties.push(
        t.objectProperty(
          t.identifier('displayName'),
          t.stringLiteral(displayName)
        )
      );
    }
  };

  /**
   * Given a CallExpression of `classBound[JSX.IntrinsicElement]()` tries to move the proxy method.
   * Returns a boolean indicating whether it was successfully added.
   */
  const inlineElementType = (call: t.CallExpression, elementType: string) => {
    const [optionsOrClassName] = call.arguments;

    if (
      call.arguments.length === 1 &&
      optionsOrClassName.type === 'ObjectExpression'
    ) {
      optionsOrClassName.properties.push(
        t.objectProperty(
          t.identifier('elementType'),
          t.stringLiteral(elementType)
        )
      );

      return;
    }

    // When the second argument is an ObjectExpression it has to be [className, variants, elementType]
    const isShortSignature =
      call.arguments.length === 2 &&
      call.arguments[1].type === 'ObjectExpression';

    // When it's not for sure the short signature it has to be [className, displayName, variants, elementType],
    // otherwise elementType can always be passed as the fourth argument
    const elementTypePosition = isShortSignature ? 2 : 3;

    // Fill with null literals
    for (let i = 0; i < elementTypePosition; ++i) {
      if (!call.arguments[i]) {
        call.arguments[i] = t.nullLiteral();
      }
    }

    call.arguments[elementTypePosition] = t.stringLiteral(elementType);
  };

  const transformPositionalSignatures = (
    call: t.CallExpression,
    displayName: string | null
  ) => {
    if (displayName && shouldInsertDisplayNameIntoPositionalSignature(call)) {
      call.arguments.splice(1, 0, t.stringLiteral(displayName));
    }
  };

  /**
   * Given an arbitrary expression, tries to retrieve its static value, e.g.,
   * for Identifiers, StringLiterals or TemplateLiterals with only static parts
   */
  const getStaticExpressionValue = (expression: t.Expression) => {
    switch (expression.type) {
      case 'Identifier':
        return expression.name;

      case 'StringLiteral':
        return expression.value;

      case 'TemplateLiteral':
        return expression.quasis.length === 1
          ? expression.quasis[0].value.raw
          : null;

      default:
        return null;
    }
  };

  const isStaticObjectKey = (key: t.Expression, name: string) =>
    getStaticExpressionValue(key) === name;

  /**
   * Given a `CallExpression` of the `classBound` function, tries to infer the signature used by the nature
   * of the arguments and decides whether it is safe to insert an explicit `displayName` as the second argument.
   * It is considered safe when it is clear that no explicit `displayName` is given in the input.
   *
   * @param   call        Call to check for arguments
   * @returns             Whether to insert an explicit `displayName`
   */
  const shouldInsertDisplayNameIntoPositionalSignature = (
    call: t.CallExpression
  ) => {
    // When there's only the className argument there cannot be a displayName
    if (call.arguments.length === 1) {
      return true;
    }

    // When there are multiple arguments we can be sure that the second is variants
    // when it's an object expression, so `displayName` can be added before it
    if (
      call.arguments.length > 1 &&
      call.arguments[1].type === 'ObjectExpression'
    ) {
      return true;
    }

    // When there are three arguments and the (className, variants, elementType) signature couldn't be
    // inferred from `variants` being an ObjectExpression, we can still be sure we have it when the last
    // one is a string (i.e. `elementType` is an intrinsic JSX element)
    if (
      call.arguments.length === 3 &&
      safeNonObjectTypes.includes(
        call.arguments[2].type as t.Expression['type']
      )
    ) {
      return true;
    }

    return false;
  };

  return importClassBoundVisitor as Visitor<any>;
}
