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
