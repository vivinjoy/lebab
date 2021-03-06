import estraverse from 'estraverse';

export default
  function (ast) {
    estraverse.replace(ast, {
      enter: propertyToShorthand
    });
  }

function propertyToShorthand(node) {
  if (node.type === 'Property' && equalIdentifiers(node.key, node.value)) {
    node.shorthand = true;
  }
}

function equalIdentifiers(a, b) {
  return a.type === 'Identifier' && b.type === 'Identifier' && a.name === b.name;
}
