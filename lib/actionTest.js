'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _chai = require('chai');

var _index = require('./index');

var _ramda = require('ramda');

var _howTheTestWasWon = require('how-the-test-was-won');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var isNotEmpty = (0, _ramda.complement)(_ramda.isEmpty);
var falseys = [undefined, false, null, {}, [], ''];
var testFalseyVal = function testFalseyVal(func) {
  return function (val) {
    return describe('given a ' + val + ' value', function () {
      return (0, _howTheTestWasWon.shouldNotThrow)(func, val);
    });
  };
};

var runErrorTests = function runErrorTests(func, action) {
  var testFunc = testFalseyVal(func);

  falseys.forEach(testFunc);
  (0, _howTheTestWasWon.shouldNotThrow)(func, action);
};

exports.default = function (defaultState, reducer) {
  return function (_ref) {
    var name = _ref.name;
    var creator = _ref.creator;
    var payload = _ref.payload;
    var type = _ref.type;
    var expectedObj = _ref.expectedObj;
    var _ref$meta = _ref.meta;
    var meta = _ref$meta === undefined ? {} : _ref$meta;

    describe('given a valid ' + name + ' action', function () {
      var actionCreator = creator || (0, _index.createAction)(type);
      var action = actionCreator(payload, meta);

      if (type.includes('Error')) {
        (0, _howTheTestWasWon.shouldHaveKeys)(action, 'error', 'message');
      }

      describe('the action created by ' + name + ' should', function () {
        it('have the type ' + type, function () {
          (0, _chai.expect)(action.type).to.equal(type);
        });
      });

      var expected = _extends({}, defaultState, expectedObj);
      var expectedKeys = Object.keys(expected);
      var result = reducer(defaultState, action);

      runErrorTests(actionCreator, action);

      if (isNotEmpty(expectedObj)) (0, _howTheTestWasWon.testIfExists)(result);

      (0, _howTheTestWasWon.shouldBeAnObject)(result);
      _howTheTestWasWon.shouldHaveKeys.apply(null, [result].concat(_toConsumableArray(expectedKeys)));

      it('should return the expected result', function () {
        (0, _chai.expect)(result).to.deep.equal(expected);
      });
    });
  };
};