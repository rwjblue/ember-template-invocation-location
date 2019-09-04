'use strict';

function isProduction() {
  return process.env.EMBER_ENV === 'production';
}

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry(type, registry) {
    if (!isProduction()) {
      registry.add('htmlbars-ast-plugin', this._buildPlugin());
    }
  },

  _buildPlugin() {
    return {
      name: 'component-attributes',
      plugin: require('./lib/ast-transform'),
      baseDir() {
        return __dirname;
      },

      parallelBabel: {
        requireFile: __filename,
        buildUsing: '_buildPlugin',
        params: {},
      },
    };
  },

  included() {
    this._super.included.apply(this, arguments);

    if (!isProduction()) {
      this.import('vendor/ember-template-invocation-location/index.js');
    }
  },
};
