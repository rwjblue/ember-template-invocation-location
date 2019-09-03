const LOCATION_PROPERTY = 'debugTemplateInvocationSite'; // must match addon/index.js value

function isComponentInvocation(node) {
  // TODO: super naive, needs to handle block params, paths, named args, etc
  return node.tag[0].toUpperCase() === node.tag[0];
}

module.exports = function(env) {
  let { builders: b } = env.syntax;

  let transform = node => {
    if (node.type === "SubExpression" && node.hash.pairs.find(p => p.key === "isTemplateInvocationInfo")) {
      return;
    }

    let moduleName = env.meta && env.meta.moduleName;

    let locationInfo = b.sexpr("hash", [], b.hash([
      b.pair('isTemplateInvocationInfo', b.boolean(true)),
      b.pair('template', moduleName ? b.string(moduleName) : b.null()),
      b.pair('line', b.number(node.loc.start.line)),
      b.pair('column', b.number(node.loc.start.column)),
      b.pair('parent', b.path(`@${LOCATION_PROPERTY}`)),
    ]));

    if (node.type === "ElementNode") {
      node.attributes.push(b.attr(`@${LOCATION_PROPERTY}`, locationInfo));
    } else {
      node.hash.pairs.push(b.pair(LOCATION_PROPERTY, locationInfo));
    }
  };

  return {
    name: "ast-transform",

    visitor: {
      SubExpression: transform,
      MustacheStatement: transform,
      BlockStatement: transform,
      ElementNode(node) {
        if (isComponentInvocation(node)) {
          transform(node);
        }
      }
    }
  };
};
