import classBound, { extend } from 'class-bound-components';

const FooComponent = classBound('fooClass', 'FooComponent');
const BarComponent1 = classBound.extend(
  FooComponent,
  'barClass',
  'BarComponent1'
);
const BarComponent2 = extend(FooComponent, 'barClass', 'BarComponent2');
const BarComponent3 = classBound.extend(
  FooComponent,
  'barClass',
  'BazComponent',
  {
    bar: 'barClass',
  }
);
const BarComponent4 = classBound.extend(
  FooComponent,
  'barClass',
  'BarComponent4',
  {
    bar: 'barClass',
  }
);
