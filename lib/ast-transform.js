const LOCATION_PROPERTY = '__templateInvocationSite__'; // must match addon/index.js value

function isComponentInvocation(node) {
  // TODO: super naive, needs to handle block params, paths, named args, etc
  return node.tag[0].toUpperCase() === node.tag[0];
}

module.exports = function(env) {
  console.log(JSON.stringify(env.meta));

  let { builders } = env.syntax;

  let transform = node => {
    let locationInfo = {
      template: env.meta ? env.meta.moduleName : undefined,
      line: node.loc.start.line,
      column: node.loc.start.column
    };
    let locationInfoASTNode = builders.string(JSON.stringify(locationInfo));

    if (node.type === "ElementNode") {
      node.attributes.push(builders.attr(`@${LOCATION_PROPERTY}`, locationInfoASTNode));
    } else {
      node.hash.pairs.push(builders.pair(LOCATION_PROPERTY, locationInfoASTNode));
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
