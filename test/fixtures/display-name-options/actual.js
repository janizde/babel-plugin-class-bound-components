import classBound from 'class-bound-components';

const FooComponent = classBound({
  className: ['foo', 'bar']
});

let Var1, Var2 = classBound({
  className: 'foo',
});

const BarComponent = classBound({
  displayName: 'CustomDisplayName',
  className: 'bar',
});

const someOptions = {
  className: 'foo',
  variants: { isActive: 'active' },
};

const ExternalOptions = classBound(someOptions);
const ExternalOptionsSpread = classBound({
  ...someOptions,
  className: 'bar',
});

const { $$typeof } = classBound({ className: 'foo' });
const BazComponent1 = classBound({
  'displayName': 'Custom1',
});
const BazComponent2 = classBound({
  ['displayName']: 'Custom1',
});
const BazComponent3 = classBound({
  [`displayName`]: 'Custom1',
});
const BazComponent4 = classBound({
  [`displayName${''}`]: 'Custom1',
});
