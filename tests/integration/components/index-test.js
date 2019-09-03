import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import getInvocationLocation from 'ember-template-invocation-location';
import { helper } from '@ember/component/helper';

module('Integration | Component | index', function(hooks) {
  setupRenderingTest(hooks);

  skip('allows helpers to access the template invocation location', async function(assert) {
    this.owner.register('helper:invoke-me', helper((params, hash) => {
      let location = getInvocationLocation(hash);

      assert.step(`${location.moduleName} @ L${location.line}:C${location.column}`);
    }));

    await render(hbs('some-stuff \n\n other stuff {{invoke-me}}', { moduleName: 'app/foo/bar.hbs' }));

    assert.verifySteps([
      'app/foo/bar.hbs @ L3:C20',
    ]);
  });
});
