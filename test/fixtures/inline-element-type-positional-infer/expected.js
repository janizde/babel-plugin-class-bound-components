import classBound from 'class-bound-components';
const foo = 'Foo';
const component = 'Component';
const variants = {
  bar: 'isBar',
};
const FooComponent1 = classBound('fooClass', `${foo}${component}`, null, 'a');
const FooComponent2 = classBound('fooClass', '' + foo + component, null, 'a');
const FooComponent3 = classBound('fooClass', foo + component, null, 'a');
const FooComponent4 = classBound(
  'fooClass',
  foo + component,
  {
    bar: 'barClass',
  },
  'a'
);
const FooComponent5 = classBound('fooClass', foo + component, variants, 'a');
const FooComponent6 = classBound('fooClass', variants, null, 'a');
const FooComponent7 = classBound(
  'fooClass',
  {
    bar: 'isBar',
  },
  'a'
);
