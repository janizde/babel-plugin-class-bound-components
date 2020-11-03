import classBound from 'class-bound-components';
const FooComponent1 = classBound({
  className: 'fooClass',
  variants: {
    bar: 'barClass',
  },
  displayName: 'FooComponent1',
  elementType: 'h1',
});
const FooComponent2 = classBound({
  className: 'fooClass',
  variants: {
    bar: 'barClass',
  },
  displayName: 'BarComponent',
  elementType: 'h1',
});
const FooComponent3 = classBound({
  ...someObject,
  className: 'fooClass',
  variants: {
    bar: 'barClass',
  },
  elementType: 'h1',
});
const FooComponent4 = classBound(
  'fooClass',
  'FooComponent4',
  {
    bar: 'barClass',
  },
  'h1'
);
const FooComponent5 = classBound('fooClass', 'FooComponent5', null, 'h1');
const FooComponent6 = classBound(null, null, null, 'h1');
