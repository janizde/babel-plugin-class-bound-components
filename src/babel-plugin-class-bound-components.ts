import { Visitor } from '@babel/traverse';
import * as t from '@babel/types';

type BabelTypes = typeof t;

export default function (babelTypes: { types: BabelTypes }) {
  return {
    name: 'class-bound-components',
    visitor: makeRootVisitor(babelTypes.types),
  };
}

function makeRootVisitor(t: BabelTypes): Visitor {
  const importClassBoundVisitor: Visitor = {
    ImportDeclaration(path) {
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
      });
    },
  };

  const callVisitor: Visitor<{ classBoundSpecifier: string }> = {
    CallExpression(path) {
      const {
        node: { callee },
      } = path;

      if (
        callee.type === 'Identifier' &&
        callee.name === this.classBoundSpecifier
      ) {
        const displayName =
          path.parent.type === 'VariableDeclarator' &&
          path.parent.id.type === 'Identifier'
            ? path.parent.id.name
            : null;

        transformArguments(path.node, displayName);
        return;
      }

      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === this.classBoundSpecifier
      ) {
        // traverse with elementType
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

  const transformArguments = (
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

  const transformPositionalSignatures = (
    call: t.CallExpression,
    displayName: string | null
  ) => {
    if (displayName && shouldInsertDisplayNameIntoPositionalSignature(call)) {
      call.arguments.splice(1, 0, t.stringLiteral(displayName));
    }
  };

  const isStaticObjectKey = (key: t.Expression, name: string) =>
    (key.type === 'Identifier' && key.name === name) ||
    (key.type === 'StringLiteral' && key.value === name) ||
    (key.type === 'TemplateLiteral' &&
      key.quasis.length === 1 &&
      key.quasis[0].value.raw === name);

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

    // When there are two arguments it could be displayName or variants
    // We can only be completely sure it's variants if it's an ObjectExpression
    if (
      call.arguments.length === 2 &&
      call.arguments[1].type === 'ObjectExpression'
    ) {
      return true;
    }

    // When there are three arguments it can be (className, displayName, variants) or (className, variants, elementType)
    // We can only be completely sure it's the latter when the last argument is a string and can be identified as elementType
    // or the second argument is an ObjectExpression and can be identified as variants
    if (
      (call.arguments.length === 3 &&
        safeNonObjectTypes.includes(
          call.arguments[2].type as t.Expression['type']
        )) ||
      call.arguments[1].type === 'ObjectExpression'
    ) {
      return true;
    }

    return false;
  };

  return importClassBoundVisitor;
}
