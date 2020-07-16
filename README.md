# babel-plugin-class-bound-components

**This is a work in progress for a babel plugin that helps with some convenience transformation for `class-bound-components`, e.g., implicit display names**

Plugin transforming calls to class-bound-components

## Example

**In**

```js
// input code
```

**Out**

```js
'use strict';

// output code

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
  "plugins": ["class-bound-components"]
}
```

### Via CLI

```sh
$ babel --plugins class-bound-components script.js
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  plugins: ['class-bound-components'],
});
```
