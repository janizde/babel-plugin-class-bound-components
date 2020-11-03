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
  classBoundSpecifier: string;
  insertDisplayName: boolean;
  inlineElementType: boolean;
};

const reservedMethods = ['extend', 'withOptions', 'withVariants', 'as'];

function makeRootVisitor(t: BabelTypes): Visitor {
  const importClassBoundVisitor: Visitor<{ opts: Options }> = {
    ImportDeclaration(path, state) {
      if (path.node.source.value !== 'class-bound-components') {
        return;
      }

      const specifierName = path.node.specifiers.find(
        (s) => s.type === 'ImportDefaultSpecifier'
      )?.local.name;

      if (!specifierName) {
        return;
      }

      path.parentPath.traverse(callVisitor, {
        classBoundSpecifier: specifierName,
        insertDisplayName: !!state.opts.displayName,
        inlineElementType: !!state.opts.elementType,
      });
    },
  };

  const callVisitor: Visitor<State> = {
    CallExpression(path, state) {
      const {
        node: { callee },
      } = path;

      if (state.inlineElementType) {
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === this.classBoundSpecifier
        ) {
          // Try to get the property name from Identifier, StringLiteral, TemplateLiteral etc.
          const propertyValue = getStaticExpressionValue(
            callee.property as t.Expression
          );

          if (propertyValue && reservedMethods.indexOf(propertyValue) < 0) {
            const didInlineElementType = inlineElementType(
              path.node,
              propertyValue
            );
            if (didInlineElementType) {
              path.node.callee = t.identifier(this.classBoundSpecifier);
            }
          }

          return;
        }
      }

      const getImplicitDisplayName = (node: t.Node): string | null => {
        return node.type === 'VariableDeclarator' &&
          node.id.type === 'Identifier'
          ? node.id.name
          : null;
      };

      if (state.insertDisplayName) {
        if (
          callee.type === 'Identifier' &&
          callee.name === this.classBoundSpecifier
        ) {
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

  const inlineElementType = (
    call: t.CallExpression,
    elementType: string
  ): boolean => {
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

      return true;
    }

    if (call.arguments.length < 1) {
      return false;
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

    return true;
  };

  const transformPositionalSignatures = (
    call: t.CallExpression,
    displayName: string | null
  ) => {
    if (displayName && shouldInsertDisplayNameIntoPositionalSignature(call)) {
      call.arguments.splice(1, 0, t.stringLiteral(displayName));
    }
  };

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
