import classBound from 'class-bound-components';

const FooComponent1 = classBound.a('fooClass');
const FooComponent2 = classBound.a('fooClass', 'FooComponent');
const FooComponent3 = classBound.a('fooClass', 'FooComponent', { bar: 'barClass' });
const FooComponent4 = classBound.a('fooClass', { bar: 'barClass' });
