'use strict';

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry(type, registry) {
    registry.add('htmlbars-ast-plugin', this._buildPlugin());
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
      }
    };
  },
};
