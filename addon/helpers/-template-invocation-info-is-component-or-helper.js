import { getOwner } from '@ember/application';
import Helper from '@ember/component/helper';

// this is a hard coded value in glimmer-vm:
// https://github.com/glimmerjs/glimmer-vm/blob/v0.38.0/packages/%40glimmer/runtime/lib/component/curried-component.ts#L6
const CONTEXTUAL_COMPONENT_FLAG = 'CURRIED COMPONENT DEFINITION [id=6f00feb9-a0ef-4547-99ea-ac328f80acea]';

export default Helper.extend({
  compute([name, isBlockParam, value]) {
    let isNamedArgument = name[0] === '@';
    let isPath = name.includes('.');
    let canBeHelper = !isBlockParam && !isPath && !isNamedArgument;
    let valueIsObject = typeof value === 'object' && value !== null;

    // TODO: handle block param paths

    if (isNamedArgument) {
      // TODO: what do we do here?
    }

    if (valueIsObject && value[CONTEXTUAL_COMPONENT_FLAG]) {
      return true;
    }

    let owner = getOwner(this);
    if (canBeHelper && owner.resolveRegistration(`helper:${name}`)) {
      return true;
    }

    if (owner.resolveRegistration(`component:${name}`) || owner.resolveRegistration(`template:components/${name}`)) {
      return true;
    }

    return false;
  }
});
