(function() {
  Object.defineProperty(self, '_templateInvocationInfo', {
    enumerable: false,
    configurable: true,

    get() {
      return require('ember-template-invocation-location');
    }
  });
})();
