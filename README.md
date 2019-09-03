# ember-template-invocation-location

`ember-template-invocation-location` will allow you to debug things like the
location in a template that a given helper, component, or modifier was invoked
from; the invocation site of the thing that invoked _that_ template, and so on
up to the root most template (generally a route template).

This is primarily done in development and test builds, so it will not work in
production by default.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


## Installation


```
ember install ember-template-invocation-location
```

## API

```ts
interface TemplateLocationInformation {
  /**
    The module name of the template that invoked this component/helper/modifier.
  */
  template: string;

  /**
    The line of the invocation in the template. The line numbers in a template
    starts at `1`.
  */
  line: number;

  /**
    The column of the invocation in the template. The column numbers in a template
    start at `0`.
  */
  column: number;

  /**
    The location of the invocation of the "parent" of this component/helper/modifier.

    For example, if a route template invokes `foo-bar` component, the `parent` property
    inside `foo-bar` would reference the route template invocation information.
  */
  parent?: TemplateLocationInformation;
}

/**
  When passed the named arguments that were received (e.g. `this` in an
  `Ember.Component`, the second argument in a helpers compute method, etc), you
  will receive a structure with the following interface:

  Example (using a helper):

      // app/helpers/something.js

      import { getInvocationLocation } from 'ember-template-invocation-location';

      export default helper(function(positional, named) {
        let loc = getInvocationLocation(named);

        // ...snip... do something with `loc` 😃
      });
*/
function getInvocationLocation(): TemplateLocationInformation;

function getInvocationStack(named: NamedArguments): string[];

interface window {
  _templateInvocationInfo: {
    getInvocationLocation;
    getInvocationStack;
  }
}

declare module "ember-template-invocation-location" {
  getInvocationLocation;
  getInvocationStack;
}
```

## Usage

The general goal of this addon is to enable significantly easier debugging. As
a result of this, we expect that the majority of usages of this will not _want_
to modify the source component/helper/modifier but instead be able to gather
this info **while debugging in the devtools**. As you can see from the API
reference above, we provide both a `ember-template-invocation-location` module
you can import, as well as a `window._templateInvocationInfo` global namespace
that you can use in the middle of a debugging session.

All of the helper functions provided by this addon assume that you pass in a
`NamedArguments`. The reason for this "obscure" name is that different types of
object capture the named arguments in different ways. We have included examples
for the main types of objects just below.

### Helpers

A helper (using `helper` from `@ember/component/helper`) would look like:

```js
// app/helpers/something.js
export default helper(function(positional, named) {
  let loc = window.getInvocationLocation(named);

  // ...snip... do something with `loc` 😃
});
```

A helper (using `default` from `@ember/component/helper`) would look like:

```js
// app/helpers/something.js
export default Helper.extend({

  compute(positional, named) {
    let loc = window.getInvocationLocation(named);

    // ...snip... do something with `loc` 😃
  }
});
```

### Modifiers

```js
// app/modifier/something.js

setModifierManager(
  () => ({
    capabilities: capabilities('3.13'),

    createModifier() {},

    installModifier(_state, element, args) {
      let loc = window.getInvocationLocation(named);

      // ...snip... do something with `loc` 😃
    },

    updateModifier() {},
    destroyModifier() {},
  }),
  class DidInsertModifier {}
);
```

### Component - @ember/component

```js
// app/components/foo-bar.js

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
      let loc = window.getInvocationLocation(named);

      // ...snip... do something with `loc` 😃
  }
});
```

### Component - `@glimmer/component`

```js
// app/components/foo-bar.js

export default class extends Component {
  constructor() {
    super();

    let loc = window.getInvocationLocation(named);

    // ...snip... do something with `loc` 😃
  }
}
```

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).
