const LOCATION_PROPERTY = 'debugTemplateInvocationSite'; // must match addon/index.js value
const BUILTINS = [
  'yield',
  'outlet',
  'mount',
  'partial',
  'if',
  'unless',
  'let',
  'with',
  'log',
  'debugger',
];

// sourced from https://github.com/ember-template-lint/ember-template-lint/blob/v1.5.3/lib/rules/internal/scope.js
function getLocalName(node) {
  switch (node.type) {
    case 'ElementNode':
      // unfortunately the ElementNode stores `tag` as a string
      // if that changes in glimmer-vm this will need to be updated
      return node.tag.split('.')[0];

    case 'SubExpression':
    case 'MustacheStatement':
    case 'BlockStatement':
      return node.path.parts[0];

    case 'PathExpression':
    default:
      return node.parts[0];
  }
}

function getLocals(node) {
  switch (node.type) {
    case 'ElementNode':
    case 'Program':
    case 'Block':
    case 'Template':
      return node.blockParams;

    case 'BlockStatement':
      return node.program.blockParams;

    default:
      throw new Error(`Unknown frame type: ${node.type}`);
  }
}

class Frame {
  constructor(node) {
    let locals = getLocals(node);

    this.node = node;
    this.locals = locals;
    this.hasPartial = false;
    this.usedLocals = {};

    for (let i = 0; i < locals.length; i++) {
      this.usedLocals[locals[i]] = false;
    }
  }

  useLocal(name) {
    if (name in this.usedLocals) {
      this.usedLocals[name] = true;
      return true;
    } else {
      return false;
    }
  }

  usePartial() {
    this.hasPartial = true;
  }

  unusedLocals() {
    if (!this.hasPartial && this.locals.length > 0) {
      if (!this.usedLocals[this.locals[this.locals.length - 1]]) {
        return this.locals[this.locals.length - 1];
      }
    } else {
      return false;
    }
  }

  isLocal(name) {
    return this.locals.indexOf(name) !== -1;
  }
}

class Scope {
  constructor() {
    this.frames = [];
  }

  pushFrame(node) {
    this.frames.push(new Frame(node));
  }

  popFrame() {
    this.frames.pop();
  }

  frameHasUnusedBlockParams() {
    return this.frames[this.frames.length - 1].unusedLocals();
  }

  useLocal(node) {
    let name = getLocalName(node);

    for (let i = this.frames.length - 1; i >= 0; i--) {
      if (this.frames[i].useLocal(name)) {
        break;
      }
    }
  }

  usePartial() {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      this.frames[i].usePartial();
    }
  }

  isLocal(node) {
    let name = getLocalName(node);

    for (let i = this.frames.length - 1; i >= 0; i--) {
      if (this.frames[i].isLocal(name)) {
        return true;
      }
    }
  }

  get currentNode() {
    let currentFrame = this.frames[this.frames.length - 1];

    return currentFrame && currentFrame.node;
  }
}

function isDynamicComponent(scope, element) {
  let open = element.tag.charAt(0);

  let isLocal = scope.isLocal(element);
  let isNamedArgument = open === '@';
  let isThisPath = element.tag.indexOf('this.') === 0;

  return isLocal || isNamedArgument || isThisPath;
}

function isAngleBracketComponent(scope, element) {
  let open = element.tag.charAt(0);
  let isPath = element.tag.indexOf('.') > -1;

  let isUpperCase = open === open.toUpperCase() && open !== open.toLowerCase();

  return (isUpperCase && !isPath) || isDynamicComponent(scope, element);
}

function shouldAddInvocationLocation(scope, node) {
  // avoid infinite loop, don't rewrap our own hash
  if (
    node.type === 'SubExpression' &&
    node.hash.pairs.find(p => p.key === 'isTemplateInvocationInfo')
  ) {
    return false;
  }

  if (
    node.type === 'SubExpression' &&
    node.path.original === '-template-invocation-info-is-component-or-helper'
  ) {
    return false;
  }

  if (
    ['SubExpression', 'BlockStatement', 'MustacheStatement'].includes(node.type) &&
    node.hash.pairs.find(p => p.key === 'debugTemplateInvocationSite')
  ) {
    return false;
  }

  if (node.type === 'ElementNode' && !isAngleBracketComponent(scope, node)) {
    return false;
  }

  let invokee = node.path ? node.path.original : node.tag;
  if (BUILTINS.includes(invokee)) {
    return false;
  }

  return true;
}

module.exports = function(env) {
  let { builders: b } = env.syntax;

  let PROCESSED_NODES = new WeakSet();
  let scope = new Scope();

  let transform = node => {
    if (!shouldAddInvocationLocation(scope, node)) {
      return;
    }

    let moduleName = env.meta && env.meta.moduleName;

    let locationInfo = b.sexpr(
      'hash',
      [],
      b.hash([
        b.pair('isTemplateInvocationInfo', b.boolean(true)),
        b.pair('template', moduleName ? b.string(moduleName) : b.null()),
        b.pair('line', b.number(node.loc.start.line)),
        b.pair('column', b.number(node.loc.start.column)),
        b.pair('parent', b.path(`@${LOCATION_PROPERTY}`)),
      ])
    );

    if (node.type === 'ElementNode') {
      node.attributes.push(b.attr(`@${LOCATION_PROPERTY}`, locationInfo));
    } else {
      node.hash.pairs.push(b.pair(LOCATION_PROPERTY, locationInfo));
    }

    return node;
  };

  function pushFrame(node) {
    scope.pushFrame(node);
  }

  function popFrame() {
    scope.popFrame();
  }

  return {
    name: 'ast-transform',

    visitor: {
      Program: {
        enter: pushFrame,
        exit: popFrame,
      },
      ElementNode: {
        enter(node) {
          transform(node);
        },

        keys: {
          children: {
            enter: pushFrame,
            exit: popFrame,
          },
        },
      },
      SubExpression: transform,
      MustacheStatement(node) {
        let hasArguments = node.params.length > 0 || node.hash.pairs.length > 0;

        if (hasArguments) {
          transform(node);
        } else if (shouldAddInvocationLocation(scope, node) && !PROCESSED_NODES.has(node)) {
          // we are dealing with an ambiguous mustache invocation (we can't
          // tell if its a property lookup, a helper invocation, a component
          // invocation, etc) that isn't a built-in keyword
          // in order to deal with this we rely on a runtime helper (`-is-component-or-helper`)
          //
          // the result is that a simple mustache like `{{foo}}` is rewritten
          // to something like (whitespace added for clarity, but the result
          // will not include additional whitespace):
          //
          // {{#if (-template-invocation-info-is-component-or-helper  foo)}}
          //   {{foo debugTemplateInvocationSite=(hash ...)}}
          // {{else}}
          //   {{foo}}
          // {{/if}}

          let clonedNode = JSON.parse(JSON.stringify(node));
          let isBlockParam = scope.isLocal(node);

          let conditional = b.block(
            'if',
            [
              b.sexpr(
                '-template-invocation-info-is-component-or-helper',
                [b.string(node.path.original), b.boolean(isBlockParam), b.path(node.path.original)],
                null
              ),
            ],
            null,
            b.program([transform(clonedNode)]),
            b.program([node])
          );

          PROCESSED_NODES.add(node);

          return conditional;
        }
      },
      BlockStatement: transform,
    },
  };
};
