# babel-plugin-class-bound-components

Plugin transforming calls to [class-bound-components](https://github.com/janizde/class-bound-components)

1. [Display Name Inlining:](#display-name-inlining) Infers implicit `displayName` values, e.g., looking at which variables `classBound` components get assigned to and inlines these into the signatures.
2. [Element Type Inlining:](#element-type-inlining) Replaces usage of the `Proxy` methods for intrinsic HTML elements (like `classBound.div`, `classBound.li` or `classBound.button`) to the primary signature to remove the runtime requirement of `Proxy`

## Display Name Inlining

> **TL;DR:** If you don't want to type out the `displayName` for each call of `classBound` but want a similar behavior to regular React functional component display names, use this transformation.

Usually, `displayName`s in React benefit from the automatic assignment to `Function.name` when defining a functional component, which will make the component appear as the name of the function in React DevTools and Error traces.

Unfortunately, this doesn't work for components created with `classBound`, since these are defined in a closure. For this, all signatures of `classBound` can be provided with an explicit string for the `displayName` property of the component.

This babel transformation tries to infer the `displayName` in the fashion like `Function.name` would normally do and inlines these into the calls of `classBound`.

### Config

Can be enabled (default) or disabled with the `displayName` option, e.g.,

```js
// .babelrc
{
  "plugins": [
    // ...
    ["babel-plugin-class-bound-components": {
      "displayNames": true
    }]
  ]
}
```

### Example

**In**

```js
// input code
import classBound, { extend } from 'class-bound-components';

// These would appear as _Anonymous_ in React dev tools and error messages, since no explicit `displayName` argument is passed
const MyList = classBound.ul('myList', {
  isWide: 'myList--wide',
});

const MyListItem = classBound.li('myListItem', {
  isActive: 'myListItem--active',
});

const CustomList = extend(MyList, 'customList', {
  isFlashy: 'customList--flashy',
});

const CompFropmOptions = classBound({
  className: ['foo', 'bar'],
});

let foo = 'bar',
  SomeComp = classBound('someComp');
```

**Out**

```js
'use strict';

// output code
import classBound from 'class-bound-components';

// Babel plugin infers the `displayName` and explicitly inserts it into the signatures
const MyList = classBound('myList', 'MyList', {
  isWide: 'myList--wide',
});

const MyListItem = classBound('myListItem', 'MyListItem', {
  isWide: 'myListItem--wide',
});

const CustomList = extend(MyList, 'CustomList', 'customList', {
  isFlashy: 'customList--flashy',
});

const CompFromOptions = classBound({
  className: ['foo', 'bar'],
  displayName: 'CompFromOptions',
});

let foo = 'bar',
  SomeComp = classBound('someComp', 'SomeComp');
```

## Element Type Inlining

> **TL;DR:** If you make use of the shorthand `classBound[JSX.IntrinsicElement]()` signature, e.g., `classBound.button`, and can't be sure [ES6 `Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) is available in browsers (and don't want to polyfill it), use this transformation.

Beyond `<div />`, `classBound` can use any base element and even user land React components as a base type, which can be passed as the `elementType` argument. For each intrinsic HTML element type, a method on `classBound` is proxied for easier usage, like `classBound.button('myButton')` or `classBound.ul('myList')`. This functionality is backed by the [ES6 `Proxy` mechanism](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which is not available on IE11.

If you need to support IE11 or other outdated browsers not supporting `Proxy`, enable this transformation. It replaces all calls of `classBound[JSX.IntrinsicElement]()` in your sources with calls to the primary, `Proxy`-less signature and inserts the desired element type as the `elementType`

### Config

Can be enabled (enabled) or disabled with the `elementTypes` option, e.g.,

```js
// .babelrc
{
  "plugins": [
    // ...
    ["babel-plugin-class-bound-components": {
      "elementType": true
    }]
  ]
}
```

### Example

**In**

```js
// input code
import classBound, { extend } from 'class-bound-components';

// `classBound.ul` and `classBound.li` will error on outdated browsers, e.g., IE11
const MyList = classBound.ul('myList', { isWide: 'myList--wide' });
const MyListItem = classBound.li('myListItem');
```

**Out**

```js
'use strict';

// output code
import classBound from 'class-bound-components';

// After transformation, `Proxy` is not made is of, so it also works on older browsers
const MyList = classBound('myList', null, { isWide: 'myList--wide' }, 'ul');
const MyListItem = classBound('myListItem', null, null, 'li');
```

## Installation

```sh
$ npm install babel-plugin-class-bound-components
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": [
    [
      "babel-plugin-class-bound-components",
      {
        "displayNames": true,
        "elementTypes": true
      }
    ]
  ]
}
```

### Via CLI

```sh
$ babel --plugins class-bound-components script.js
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  plugins: [
    [
      'babel-plugin-class-bound-components',
      {
        displayNames: true,
        elementTypes: true,
      },
    ],
  ],
});
```

&copy; 2020 Jannik Portz – [License](./LICENSE)
