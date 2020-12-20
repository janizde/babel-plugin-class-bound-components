import classBound from 'class-bound-components';
const FooComponent1 = classBound.h1({
  className: 'fooClass',
  variants: {
    bar: 'barClass',
  },
  displayName: 'FooComponent1',
});
const FooComponent2 = classBound.h1({
  className: 'fooClass',
  variants: {
    bar: 'barClass',
  },
  displayName: 'BarComponent',
});
const FooComponent3 = classBound.h1({
  ...someObject,
  className: 'fooClass',
  variants: {
    bar: 'barClass',
  },
});
const FooComponent4 = classBound.h1('fooClass', 'FooComponent4', {
  bar: 'barClass',
});
const FooComponent5 = classBound.h1('fooClass', 'BarComponent', {
  bar: 'barClass',
});
const FooComponent6 = classBound[`h${1}`]('fooClass');
const FooComponent7 = classBound['h' + 1]('fooClass');
