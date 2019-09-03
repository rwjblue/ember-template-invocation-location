ember-template-invocation-location
==============================================================================

`ember-template-invocation-location` will allow you to detect the location in a
template that a given helper, component, or modifier was invoked from. This is
primarily done in development and test builds, so it is removed in production
by default.


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-template-invocation-location
```


Usage
------------------------------------------------------------------------------

Once you've installed the addon, you can use it like:

* Helpers

```js
// app/helpers/something.js

import detectInvocationLocation from 'ember-template-invocation-location';

export default helper(function(positional, named) {
  let loc = detectInvocationLocation(named);

  // ...snip... do something with `loc` :smile:
});
```

* Modifiers

```js
// app/modifier/something.js

import detectInvocationLocation from 'ember-template-invocation-location';

setModifierManager(
  () => ({
    capabilities: capabilities('3.13'),

    createModifier() {},

    installModifier(_state, element, args) {
      let loc = detectInvocationLocation(args.named);

      // ...snip... do something with `loc` :smile:
    },

    updateModifier() {},
    destroyModifier() {},
  }),
  class DidInsertModifier {}
);
```

* Ember.Component

```js
// app/components/foo-bar.js

import detectInvocationLocation from 'ember-template-invocation-location';

export default Component.extend({
  init() {
    this._super(...arguments);
    let loc = detectInvocationLocation(this);

    // ...snip... do something with `loc` :smile:
  }
});
```

* `@glimmer/component`

```js
// app/components/foo-bar.js

import detectInvocationLocation from 'ember-template-invocation-location';

export default class extends Component {
  constructor() {
    super();

    let loc = detectInvocationLocation(this.args);

    // ...snip... do something with `loc` :smile:
  }
}
```

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
