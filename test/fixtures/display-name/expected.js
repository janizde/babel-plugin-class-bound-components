import classBound from 'class-bound-components';
const FooComponent = classBound({
  className: ['foo', 'bar'],
  displayName: 'FooComponent',
});
let Var1,
  Var2 = classBound({
    className: 'foo',
    displayName: 'Var2',
  });
const BarComponent = classBound({
  displayName: 'CustomDisplayName',
  className: 'bar',
});
const someOptions = {
  className: 'foo',
  variants: {
    isActive: 'active',
  },
};
const ExternalOptions = classBound(someOptions);
const ExternalOptionsSpread = classBound({ ...someOptions, className: 'bar' });
