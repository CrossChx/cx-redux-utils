import { expect } from 'chai';
import { createAction } from './index';
import { complement, isEmpty } from 'ramda';

import {
  testIfExists,
  shouldBeAnObject,
  shouldHaveKeys,
  shouldNotThrow,
} from 'how-the-test-was-won';

const isNotEmpty = complement(isEmpty);
const falseys = [undefined, false, null, {}, [], ''];
const testFalseyVal = func => val =>
  describe(`given a ${val} value`, () => shouldNotThrow(func, val));

const runErrorTests = (func, action) => {
  const testFunc = testFalseyVal(func);

  falseys.forEach(testFunc);
  shouldNotThrow(func, action);
};

export const actionTestSuite = (reducer, defaultState = {}) => ({
  name,
  creator,
  payload,
  type,
  payloadReassignKey,
  expectedObj = {},
  meta = {},
}) => {
  describe(`given a valid ${name} action`, () => {
    const actionCreator = creator || createAction(type);
    const action = actionCreator(payload, meta);

    if (type.includes('Error')) {
      shouldHaveKeys(action, 'error', 'message');
    }

    describe(`the action created by ${name} should`, () => {
      it(`have the type ${type}`, () => {
        expect(action.type).to.equal(type);
      });
    });

    const expectedResult = payloadReassignKey
      ? { [payloadReassignKey]: payload }
      : expectedObj;

    const expected = { ...defaultState, ...expectedResult };
    const expectedKeys = Object.keys(expected);
    const result = reducer(defaultState, action);

    runErrorTests(actionCreator, action);

    if (isNotEmpty(expectedObj)) testIfExists(result);

    shouldBeAnObject(result);
    shouldHaveKeys.apply(null, [result, ...expectedKeys]);

    it('should return the expected result', () => {
      expect(result).to.deep.equal(expected);
    });
  });
};
