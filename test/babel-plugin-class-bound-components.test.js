import * as path from 'path';
import pluginTester from 'babel-plugin-tester';
import babelPluginClassBoundComponents from '../src/babel-plugin-class-bound-components';

const fixture = (fixtureName) => {
  const fixturePath = path.resolve(__dirname, 'fixtures', fixtureName);

  return {
    fixture: path.join(fixturePath, 'actual.js'),
    fixtureOutput: path.join(fixturePath, 'expected.js'),
  };
};

pluginTester({
  pluginName: 'class-bound-components',
  plugin: babelPluginClassBoundComponents,
  tests: [
    {
      title: 'should add an explicit displayName to the options signature',
      ...fixture('display-name'),
    },
  ],
});
