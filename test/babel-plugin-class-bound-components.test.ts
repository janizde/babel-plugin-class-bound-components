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
    },
    {
      title: 'should add an explicit displayName to positional signatures',
      ...fixture('display-name-positional'),
    },
    {
      title:
        'should detect the classBound function only for default imports and leave usages of others as-is',
      ...fixture('detect-import'),
    },
    {
      title:
        'should insert elementType into options signature when using a proxy method',
      ...fixture('inline-element-type-options'),
    },
  ],
});
