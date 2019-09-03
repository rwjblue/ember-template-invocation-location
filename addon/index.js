import { assert } from '@ember/debug';
const LOCATION_PROPERTY = '__templateInvocationSite__'; // must match index.js value

export default function(locationHolder) {
  assert(`Expected ${locationHolder} to include the custom template invocation information but it was missing. Please confirm you have ember-template-invocation-location setup properly in your package.json`, locationHolder[LOCATION_PROPERTY]);

  let locationInfo = JSON.parse(locationHolder[LOCATION_PROPERTY]);

  return locationInfo;
}
