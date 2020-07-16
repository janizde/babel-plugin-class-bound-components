import classBoundSomethingDifferent from 'something-different';
import classBoundDefault from 'class-bound-components';
import * as classBoundAll from 'class-bound-components';

const classBoundRequire = require('class-bound-components').default;

const ComponentClassBoundSomethingDifferent = classBoundSomethingDifferent({
  className: 'foo',
});
const ComponentClassBoundDefault = classBoundDefault({
  className: 'foo',
  displayName: 'ComponentClassBoundDefault',
});
const ComponentClassBoundAll = classBoundAll({
  className: 'foo',
});
const ComponentClassBoundRequire = classBoundRequire({
  className: 'foo',
});
