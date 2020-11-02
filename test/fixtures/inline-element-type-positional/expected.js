import classBound from 'class-bound-components';
const FooComponent1 = classBound('fooClass', null, null, 'a');
const FooComponent2 = classBound('fooClass', 'FooComponent', null, 'a');
const FooComponent3 = classBound(
  'fooClass',
  'FooComponent',
  {
    bar: 'barClass',
  },
  'a'
);
const FooComponent4 = classBound(
  'fooClass',
  {
    bar: 'barClass',
  },
  'a'
);
