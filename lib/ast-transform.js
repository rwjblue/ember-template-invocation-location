const LOCATION_PROPERTY = 'debugTemplateInvocationSite'; // must match addon/index.js value
const BUILTINS = ['yield', 'outlet', 'mount', 'partial', 'if', 'unless', 'let', 'with', 'log', 'debugger'];

function isComponentInvocation(node) {
  // TODO: super naive, needs to handle block params, paths, named args, etc
  return node.tag[0].toUpperCase() === node.tag[0];
}

function shouldAddInvocationLocation(node) {
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

  if (node.type === 'ElementNode' && !isComponentInvocation(node)) {
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

  let transform = node => {
    if (!shouldAddInvocationLocation(node)) {
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

  return {
    name: 'ast-transform',

    visitor: {
      SubExpression: transform,
      MustacheStatement(node) {
        let hasArguments = node.params.length > 0 || node.hash.pairs.length > 0;

        if (hasArguments) {
          transform(node);
        } else if (shouldAddInvocationLocation(node) && !PROCESSED_NODES.has(node)) {
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

          let conditional = b.block(
            'if',
            [
              b.sexpr(
                '-template-invocation-info-is-component-or-helper',
                [b.string(node.path.original), b.boolean(false), b.path(node.path.original)],
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
      ElementNode: transform,
    },
  };
};
