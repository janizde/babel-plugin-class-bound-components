import { Visitor } from 'babel-traverse';
import { CallExpression, Identifier, Expression } from 'babel-types';

export default function () {
  return {
    name: 'class-bound-components',
    visitor: {
      ...importClassBoundVisitor,
    },
  };
}

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
      // traverse down
      return;
    }

    if (
      callee.type === 'MemberExpression' &&
      callee.object.type === 'Identifier' &&
      callee.object.name === this.classBoundSpecifier
    ) {
      const elementType = (callee.property as Identifier).name;
      // traverse with elementType
    }
  },
};

const transformArguments = (args: Array<Expression>) => {};
