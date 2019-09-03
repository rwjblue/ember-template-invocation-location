import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { getInvocationLocation, getInvocationStack } from 'ember-template-invocation-location';
import { helper } from '@ember/component/helper';

module('Integration | Component | index', function(hooks) {
  setupRenderingTest(hooks);

  test('allows helpers to access the template invocation location', async function(assert) {
    this.owner.register('helper:invoke-me', helper((params, hash) => {
      let location = getInvocationLocation(hash);

      assert.step(`${location.template} @ L${location.line}:C${location.column}`);
    }));

    await render(hbs('some-stuff \n\n other stuff {{invoke-me}}', { moduleName: 'app/foo/bar.hbs' }));

    assert.verifySteps([
      'app/foo/bar.hbs @ L3:C13',
    ]);
  });

  test('can determine parent invocation site', async function(assert) {
    assert.expect(1);

    this.owner.register('template:components/foo-bar', hbs('\n {{invoke-me}}', { moduleName: 'app/templates/components/foo-bar.hbs' }));

    this.owner.register('helper:invoke-me', helper((params, hash) => {
      let location = getInvocationLocation(hash);

      assert.deepEqual(location, {
        isTemplateInvocationInfo: true,
        template: 'app/templates/components/foo-bar.hbs',
        line: 2,
        column: 1,
        parent: {
          isTemplateInvocationInfo: true,
          template: 'app/templates/bar.hbs',
          line: 3,
          column: 13,
          parent: undefined,
        }
      });
    }));

    await render(hbs('some-stuff \n\n other stuff {{foo-bar}}', { moduleName: 'app/templates/bar.hbs' }));
  });

  module('getInvocationStack', function() {

    test('can access simplified stack', async function(assert) {
      assert.expect(1);

      this.owner.register('template:components/foo-bar', hbs('\n {{invoke-me}}', { moduleName: 'app/templates/components/foo-bar.hbs' }));

      this.owner.register('helper:invoke-me', helper((params, hash) => {
        let stack = getInvocationStack(hash);

        assert.deepEqual(stack, [
          'app/templates/components/foo-bar.hbs @ L2:C1',
          'app/templates/bar.hbs @ L3:C13'
        ]);
      }));

      await render(hbs('some-stuff \n\n other stuff {{foo-bar}}', { moduleName: 'app/templates/bar.hbs' }));
    });

    test('can access simplified stack from global (without modifying source helper/component/modifier)', async function(assert) {
      assert.expect(1);

      this.owner.register('template:components/foo-bar', hbs('\n {{invoke-me}}', { moduleName: 'app/templates/components/foo-bar.hbs' }));

      this.owner.register('helper:invoke-me', helper((params, hash) => {
        let stack = self._templateInvocationInfo.getInvocationStack(hash);

        assert.deepEqual(stack, [
          'app/templates/components/foo-bar.hbs @ L2:C1',
          'app/templates/bar.hbs @ L3:C13'
        ]);
      }));

      await render(hbs('some-stuff \n\n other stuff {{foo-bar}}', { moduleName: 'app/templates/bar.hbs' }));
    });
  });
});
