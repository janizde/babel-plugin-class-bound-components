import classBound from 'class-bound-components';

const FooComponent = classBound.a('fooComponent');
const FooComponent2 = classBound.extend(FooComponent, 'barClass');
const FooComponent3 = classBound.withOptions(FooComponent, options => options);
const FooComponent4 = classBound.withVariants({ bar: 'barClass' });
const FooComponent5 = classBound.as('button');
