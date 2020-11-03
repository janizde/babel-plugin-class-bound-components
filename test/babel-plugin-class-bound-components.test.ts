import * as path from 'path';
import pluginTester from 'babel-plugin-tester';
import babelPluginClassBoundComponents from '../src/babel-plugin-class-bound-components';

const fixture = (fixtureName: string) => {
  const fixturePath = path.resolve(__dirname, 'fixtures', fixtureName);

  return {
    fixture: path.join(fixturePath, 'actual.js'),
    outputFixture: path.join(fixturePath, 'expected.js'),
  };
};

pluginTester({
  pluginName: 'class-bound-components',
  plugin: babelPluginClassBoundComponents,
  tests: [
    {
      title: 'should add an explicit displayName to the options signature',
      ...fixture('display-name-options'),
      pluginOptions: {
        displayName: true,
        elementType: false,
      },
    } as any,
    {
      title: 'should add an explicit displayName to positional signatures',
      ...fixture('display-name-positional'),
      pluginOptions: {
        displayName: true,
        elementType: false,
      },
    },
    {
      title:
        'should detect the classBound function only for default imports and leave usages of others as-is',
      ...fixture('detect-import'),
      pluginOptions: {
        displayName: true,
        elementType: false,
      },
    },
    {
      title:
        'should add explicit displayNames to calls of element proxy methods',
      ...fixture('display-name-element-proxy'),
      pluginOptions: {
        displayName: true,
        elementType: false,
      },
    },
    {
      title:
        'should insert elementType into options signature when using a proxy method',
      ...fixture('inline-element-type-options'),
      pluginOptions: {
        displayName: false,
        elementType: true,
      },
    },
    {
      title:
        'should insert elementType into positional signatures when using a proxy method',
      ...fixture('inline-element-type-positional'),
      pluginOptions: {
        displayName: false,
        elementType: true,
      },
    },
    {
      title:
        'should try to detect the short signature or otherwise insert elementType at fourth position',
      ...fixture('inline-element-type-positional-infer'),
      pluginOptions: {
        displayName: false,
        elementType: true,
      },
    },
    {
      title: 'should not transform reserved methods to elementTypes',
      ...fixture('inline-element-type-reserved-methods'),
      pluginOptions: {
        displayName: false,
        elementType: true,
      },
    },
    {
      title: 'should add displayNames for calls of extend',
      ...fixture('display-name-extend'),
      pluginOptions: {
        displayName: true,
        elementType: false,
      },
    },
  ],
});
