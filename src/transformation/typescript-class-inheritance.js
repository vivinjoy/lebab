import estraverse from 'estraverse';
import ExpressionStatement from './../syntax/expression-statement.js'
import CallExpression from './../syntax/call-expression.js'

export default
  function(ast) {
    estraverse.traverse(ast, {
      enter: superClassDetector
    });

    estraverse.traverse(ast, {
      enter: superclassInstallation
    });

    estraverse.replace(ast, {
      enter: oldInheritanceReplacement
    });
  }

var superClassesMap = [];
var classes = [];

function superClassDetector(node) {
  let classNode, superClassNode;
  // Finding a self executing anonymous function call
  if(node.type === 'CallExpression' && node.callee &&  node.callee.type === 'FunctionExpression' && 
    node.callee.id === null && node.callee.body && node.callee.body.type === 'BlockStatement')
  {
    // finding a class declaration inside the function call
    for(let i = 0; i < node.callee.body.body.length; i++) {
      let element = node.callee.body.body[i];
      if(element && element.type === 'ClassDeclaration' && element.superClass === null) {
        classNode = element;
      }
    }
    if(classNode){
      for(let i = 0; i < node.callee.body.body.length; i++)
      {
        // check to ensure presence of super class
        // finding if any sibling nodes have a function call with same class name
        // most transpilers implement class inheritance by calling some pre-defined extend function with the class
        let element = node.callee.body.body[i];
        if(element && element.type === 'ExpressionStatement' && 
           element.expression && element.expression.type === 'CallExpression' &&
           element.expression.arguments && element.expression.arguments[0].type === 'Identifier' &&
           element.expression.arguments[0].name === classNode.id.name 
          ) {
              // fetching super class node
              if(node.arguments && node.arguments.length === 1)
              {
                superClassNode = node.arguments[0];
              }
            }
      }
    }

    // Adding the found class inheritance
    if(classNode && superClassNode)
    {
      classes.push(classNode);
      superClassesMap[classNode.id.name] = superClassNode;
      node._class = classNode;
      this.skip();
    }
  }
}

function getConstructorNode(classNode) {
  let constructorNode;
  for(let i = 0; i < classNode.body.body.length; i++) {
    let element = classNode.body.body[i];
    if(element && element.type === "MethodDefinition" && element.key.name === "constructor") {
      constructorNode = element;
      break;
    }
  }
  return constructorNode;
}

function tagOldBaseConstructorCall(constructorNode) {
  if(constructorNode){
    for(let i = 0; i < constructorNode.value.body.body.length; i++) {
      let element = constructorNode.value.body.body[i];
      if(element && element.type === "ExpressionStatement" && 
        element.expression && element.expression.type === "CallExpression" &&
        element.expression.callee && element.expression.callee.object.name === "_super"
        )
      {
        element._remove = true;
        break;
      }
    }  
  }
  
}

function addNewBaseConstructorCall(constructorNode) {
  if(constructorNode) {
    let exprStatement = new ExpressionStatement();
    let callExpressionStatement = new CallExpression({type: "Super"}, [{type: "Identifier", name: "arguments"}]);
    exprStatement.expression = callExpressionStatement;
    constructorNode.value.body.body.push(exprStatement);
  }
}

function superclassInstallation(node) {
  if(node && node.type === 'ClassDeclaration') {
    // add super(arguments) call to the constructor
    if(superClassesMap[node.id.name])
    {
      node.superClass = superClassesMap[node.id.name];
      let constructorNode =  getConstructorNode(node); 
      tagOldBaseConstructorCall(constructorNode);
      addNewBaseConstructorCall(constructorNode);
      this.skip();
    }
  }
}

function oldInheritanceReplacement(node) {
  if(node._class){
    return node._class;
  }
  else if (node._remove) {
    this.remove();
  }
}