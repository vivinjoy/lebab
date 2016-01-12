var expect = require('chai').expect;
var Transformer = require('./../../lib/transformer');
var objectShorthandsTransformation = require('./../../lib/transformation/object-shorthands');

var transformer = new Transformer({});

function test(script) {
  transformer.read(script);
  transformer.applyTransformation(objectShorthandsTransformation);
  return transformer.out();
}

describe('Object shorthands', function () {

  it('should convert matching key-value entries to shorthand notation', function () {
    expect(test('({foo: foo})')).to.equal('({foo})');
  });

  it('should not convert non-matching key-value entries to shorthand notation', function () {
    expect(test('({foo: bar})')).to.equal('({foo: bar})');
  });

  it('should not convert numeric properties to shorthands', function () {
    expect(test('({10: 10})')).to.equal('({10: 10})');
  });

  // One might think we should also convert strings,
  // but there might be some explicit reason why author chose
  // to write his property names as strings,
  // like when using Advanced compilation mode of Google Closure Compiler,
  // where string keys signify that they should not be minified.
  it('should not convert string properties to shorthands', function () {
    expect(test('({"foo": foo})')).to.equal('({"foo": foo})');
  });

});
