import { DEBUG } from '@glimmer/env';
import { assert } from '@ember/debug';
const LOCATION_PROPERTY = 'debugTemplateInvocationSite'; // must match index.js value

export function getInvocationLocation(locationHolder) {
  if (DEBUG) {
    assert(`Expected ${locationHolder} to include the custom template invocation information but it was missing. Please confirm you have ember-template-invocation-location setup properly in your package.json`, locationHolder[LOCATION_PROPERTY]);

    let locationInfo = locationHolder[LOCATION_PROPERTY];

    return locationInfo;
  } else {
    return {};
  }
}

export function getInvocationStack(locationHolder) {
  let stack = [];

  if (DEBUG) {
    let current = getInvocationLocation(locationHolder);

    while (current !== undefined) {
      stack.push(`${current.template} @ L${current.line}:C${current.column}`);
      current = current.parent;
    }
  }

  return stack;
}
