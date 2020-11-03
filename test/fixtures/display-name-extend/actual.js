import classBound, { extend } from 'class-bound-components';

const FooComponent = classBound('fooClass');
const BarComponent1 = classBound.extend(FooComponent, 'barClass');
const BarComponent2 = extend(FooComponent, 'barClass');
const BarComponent3 = classBound.extend(FooComponent, 'barClass', 'BazComponent', { bar: 'barClass' });
const BarComponent4 = classBound.extend(FooComponent, 'barClass', { bar: 'barClass' });
