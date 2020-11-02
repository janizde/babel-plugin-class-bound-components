import classBound from 'class-bound-components';

const foo = 'Foo';
const component = 'Component';
const variants = { bar: 'isBar' };
const FooComponent1 = classBound.a('fooClass', `${foo}${component}`);
const FooComponent2 = classBound.a('fooClass', '' + foo + component);
const FooComponent3 = classBound.a('fooClass', foo + component);
const FooComponent4 = classBound.a('fooClass', foo + component, { bar: 'barClass' });
const FooComponent5 = classBound.a('fooClass', foo + component, variants);
const FooComponent6 = classBound.a('fooClass', variants);
const FooComponent7 = classBound.a('fooClass', { bar: 'isBar' });
