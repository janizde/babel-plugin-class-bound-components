import classBound from 'class-bound-components';
const FooComponent1 = classBound('foo', 'FooComponent1');
const FooComponent2 = classBound('foo', 'CustomDisplayName');
const FooComponent3 = classBound('foo', `CustomDisplayName${''}`);
const FooComponent4 = classBound('foo', 'CustomDisplay' + 'Name');
const FooComponent5 = classBound('foo', mightBeACustomDisplayName);
const FooComponent6 = classBound(
  'foo',
  'FooComponent6',
  thisIsDefinitelyNotADisplayName,
  'div'
);
const FooComponent7 = classBound(
  'foo',
  'FooComponent7',
  {
    isActive: 'active',
    ...other,
  },
  thisHasToBeElementType
);
const FooComponent8 = classBound('foo', undefined, variantsOrElementType);
const FooComponent9 = classBound('foo', null, variantsOrElementType);
const FooComponent10 = classBound('foo', undefined, { ...surelyVariants });
const FooComponent11 = classBound('foo', null, { ...surelyVariants });
const FooComponent12 = classBound('foo', undefined, variants, elementType);
const FooComponent13 = classBound('foo', null, variants, elementType);
const FooComponent14 = classBound('foo', 'FooComponent14', {
  ...surelyVariants,
});
