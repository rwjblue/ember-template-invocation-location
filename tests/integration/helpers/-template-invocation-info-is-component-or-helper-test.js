import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { helper } from '@ember/component/helper';

module('Integration | Helper | -template-invocation-info-is-component-or-helper', function(hooks) {
  setupRenderingTest(hooks);

  test('returns true when invoking a helper', async function(assert) {
    this.owner.register('helper:foo', helper(function() {}));

    await render(hbs`{{#if (-template-invocation-info-is-component-or-helper 'foo' false foo)}}helper found!{{/if}}`);

    assert.equal(this.element.textContent, 'helper found!');
  });

  test('returns false when helper or component do not exist', async function(assert) {
    await render(hbs`{{#if (-template-invocation-info-is-component-or-helper 'foo' false foo)}}helper found!{{/if}}`);

    assert.equal(this.element.textContent, '');
  });

  test('returns true for contextual component', async function(assert) {
    this.owner.register('template:components/x-foo', hbs``);

    await render(hbs`
      {{#let (component 'x-foo') as |thing|}}
        {{#if (-template-invocation-info-is-component-or-helper 'thing' true thing)}}component found!{{/if}}
      {{/let}}
    `);

    assert.equal(this.element.textContent.trim(), 'component found!');
  });
});
