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
        transformArguments(path.node);
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

  const transformArguments = (call: t.CallExpression) => {
    if (
      call.arguments.length === 1 &&
      call.arguments[0].type === 'ObjectExpression'
    ) {
      transformOptionsSignature(call.arguments[0]);
    }
  };

  const allowedObjectPropertyTypes: Array<
    t.ObjectExpression['properties'][0]['type']
  > = ['ObjectMethod', 'ObjectProperty'];

  const transformOptionsSignature = (objectExpression: t.ObjectExpression) => {
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
      t.objectProperty(t.identifier('displayName'), t.stringLiteral('FooBar'))
    );
  };

  const isStaticObjectKey = (key: t.Expression, name: string) =>
    (key.type === 'Identifier' && key.name === name) ||
    (key.type === 'StringLiteral' && key.value === name) ||
    (key.type === 'TemplateLiteral' &&
      key.quasis.length === 1 &&
      key.quasis[0].value.raw === name);

  return importClassBoundVisitor;
}
