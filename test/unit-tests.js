import { expect } from 'chai';
import { namedApiFetchTest } from './namedApiFetchTest';

import {
  createAction,
  createReducer,
  createSelector,
  createSetter,
  fetchCallback,
  getTicket,
  hasMethod,
} from '../src/index';

import {
  testSet,
  testIfExists,
  shouldBeAFunction,
  shouldBeAnObject,
  shouldBeAnArray,
  shouldBeAString,
  shouldBeABoolean,
  shouldNotBeNull,
  shouldBeUndefined,
  shouldThrow,
  shouldNotThrow,
} from 'how-the-test-was-won';

const runErrorCases = callback => {
  describe('an undefined argument', () => {
    shouldThrow(callback, undefined, TypeError);
  });

  describe('a null argument', () => {
    shouldThrow(callback, null, TypeError);
  });

  describe('an empty object', () => {
    shouldNotThrow(callback, {});
  });

  describe('an empty array', () => {
    shouldNotThrow(callback, []);
  });
};

describe('Redux Utils', () => {
  const TEST_ACTION_TYPE = 'TEST_ACTION_TYPE';
  const dispatchedAction = {
    type: TEST_ACTION_TYPE,
    payload: { actionTestKey: 'actionTestValue' },
  };

  describe('#createReducer', () => {
    describe('given a defaultState of type "Object" and an actionMap', () => {
      const defaultStateObject = {
        stateKey1: 'test1',
        stateKey2: 'test2',
      };
      const expectedResultState = {
        stateKey1: 'test1',
        stateKey2: 'test2',
        actionTestKey: 'actionTestValue',
        reducerTestKey: 'reducerTestValue',
      };
      const actionMap = {
        [TEST_ACTION_TYPE]: (state, action) => ({
          ...state,
          ...action.payload,
          reducerTestKey: 'reducerTestValue',
        }),
      };
      const reducer = createReducer(defaultStateObject, actionMap);

      describe('the reducer function returned', () => {
        testIfExists(reducer);
        shouldBeAFunction(reducer);
      });

      describe('given an "undefined" state and a test action', () => {
        describe('the result of invoking the reducer', () => {
          const result = reducer(undefined, dispatchedAction);

          testIfExists(result);
          shouldBeAnObject(result);

          it('should equal the default state with new keys per reducer', () => {
            expect(result).to.deep.equal(expectedResultState);
          });
        });
      });

      describe('given an existing state with keys prefilled', () => {
        describe('the result of reducers initial run', () => {
          const existingState = {
            stateKey1: 'test1',
            stateKey2: 'test2',
            actionTestKey: 'overwriteMe',
            reducerTestKey: 'overwriteMe',
          };
          const result = reducer(existingState, dispatchedAction);

          testIfExists(result);
          shouldBeAnObject(result);

          it('should return a computed state with overwritten keys per reducer', () => {
            expect(result).to.deep.equal(expectedResultState);
          });
        });
      });
    });

    describe('given a defaultState "Array" and an actionMap', () => {
      const defaultStateArray = ['test1', 'test2'];
      const expectedResultState = ['test1', 'test2', { actionTestKey: 'actionTestValue' }];
      const actionMap = {
        [TEST_ACTION_TYPE]: (state, action) => ([
          ...state,
          action.payload,
        ]),
      };
      const reducer = createReducer(defaultStateArray, actionMap);

      describe('the reducer function returned', () => {
        testIfExists(reducer);
        shouldBeAFunction(reducer);
      });

      describe('given an "undefined" state and a test action', () => {
        describe('the result of invoking the reducer', () => {
          const result = reducer(undefined, dispatchedAction);

          testIfExists(result);
          shouldBeAnArray(result);

          it('should equal the default state concatenated to the handler result', () => {
            expect(result).to.deep.equal(expectedResultState);
          });
        });
      });
    });

    describe('given a defaultState "String" and an actionMap', () => {
      const defaultStateString = 'defaultStateTestString';
      const expectedResultState = 'actionTestValue';
      const actionMap = {
        [TEST_ACTION_TYPE]: (state, action) => action.payload.actionTestKey,
      };
      const reducer = createReducer(defaultStateString, actionMap);

      describe('the reducer function returned', () => {
        testIfExists(reducer);
        shouldBeAFunction(reducer);
      });

      describe('given an "undefined" state and a test action', () => {
        describe('the result of invoking the reducer', () => {
          const result = reducer(undefined, dispatchedAction);

          testIfExists(result);
          shouldBeAString(result);

          it('should equal the string from handler result', () => {
            expect(result).to.equal(expectedResultState);
          });
        });
      });
    });

    describe('given a defaultState "Boolean" and an actionMap', () => {
      const defaultStateBool = true;
      const actionMap = {
        [TEST_ACTION_TYPE]: (state, action) => !state, // eslint-disable-line
      };
      const reducer = createReducer(defaultStateBool, actionMap);

      describe('the reducer function returned', () => {
        testIfExists(reducer);
        shouldBeAFunction(reducer);
      });

      describe('given an "undefined" state and a test action', () => {
        describe('the result of invoking the reducer', () => {
          const result = reducer(undefined, dispatchedAction);

          shouldBeABoolean(result);

          it('should flip the default state boolean', () => {
            expect(result).to.equal(false);
          });
        });
      });
    });
  });

  describe('#createAction', () => {
    describe('given the first arg (specified action Type)', () => {
      const creator = createAction(TEST_ACTION_TYPE);

      describe('the creator function returned', () => {
        testIfExists(creator);
        shouldBeAFunction(creator);
      });

      describe('given a payload passed to the function created, the result', () => {
        const createdAction = creator({ testKey: 'testVal' });

        testIfExists(createdAction);
        shouldBeAnObject(createdAction);

        it('should have a "type" and "payload" key', () => {
          expect(createdAction).to.contain.all.keys('type', 'payload');
        });

        it('should have a "type" value of TEST_ACTION_TYPE', () => {
          expect(createdAction.type).to.equal(TEST_ACTION_TYPE);
        });

        it('should retain the payload passed to it', () => {
          expect(createdAction.payload).to.deep.equal({ testKey: 'testVal' });
        });
      });
    });
  });

  describe('Lens Functions', () => {
    const testObj = {
      simpleKey: 'value',
      objectKey: {
        key1: 'value1',
        key2: 'value2',
        nestedObjectKey: {
          key3: 'value3',
          key4: 'value4',
        },
      },
    };

    describe('#createSelector', () => {
      describe('when passed a single prop name', () => {
        const selector = createSelector('simpleKey');

        describe('the return value should be a function', () => {
          testIfExists(selector);
          shouldBeAFunction(selector);
        });

        describe('given an object with a top level key, the selector', () => {
          const selected = selector(testObj);

          testIfExists(selected);
          shouldBeAString(selected);
          it('should get the correct value for the "simpleKey" property', () => {
            expect(selected).to.equal(testObj.simpleKey);
          });
        });

        describe('given an undefined value', () => {
          shouldThrow(selector, undefined, TypeError);
        });

        describe('given an empty object the result', () => {
          const result = selector({});

          shouldBeUndefined(result);
          shouldNotBeNull(result);
          shouldNotThrow(selector, {});
        });
      });

      describe('when passed an array of property names (path to key)', () => {
        const selector = createSelector(['objectKey', 'nestedObjectKey', 'key4']);

        describe('the return value should be a function', () => {
          testIfExists(selector);
          shouldBeAFunction(selector);
        });

        describe('given a deep nested key, the selector', () => {
          const selected = selector(testObj);

          testIfExists(selected);
          shouldBeAString(selected);
          it('should get the correct value for the property at the specified path', () => {
            expect(selected).to.equal(testObj.objectKey.nestedObjectKey.key4);
          });
        });

        describe('given an undefined value', () => {
          const result = selector(undefined);

          shouldBeUndefined(result);
          shouldNotBeNull(result);
        });

        describe('given an empty object the result', () => {
          const result = selector({});

          shouldBeUndefined(result);
          shouldNotBeNull(result);
          shouldNotThrow(selector, {});
        });
      });
    });

    describe('#createSetter', () => {
      describe('when passed a single property name', () => {
        const setter = createSetter('simpleKey');

        describe('the return value should be a function', () => {
          testIfExists(setter);
          shouldBeAFunction(setter);
        });

        describe('given an object with a top level key, the setter', () => {
          const written = setter('overwritten', testObj);

          testIfExists(written);
          shouldBeAnObject(written);
          it('should return the testObj with an overwritten "simpleKey" property', () => {
            expect(written).to.deep.equal({
              ...testObj,
              simpleKey: 'overwritten',
            });
          });
        });
      });

      describe('when passed an array of property names (path to key)', () => {
        const setter = createSetter(['objectKey', 'nestedObjectKey', 'key4']);

        describe('the return value should be a function', () => {
          testIfExists(setter);
          shouldBeAFunction(setter);
        });

        describe('given an object with a deep nested key, the setter', () => {
          const written = setter('overwritten', testObj);

          testIfExists(written);
          shouldBeAnObject(written);
          it('should return the equivalent of manually rewriting the key on testObj ', () => {
            expect(written).to.deep.equal({
              ...testObj,
              objectKey: {
                ...testObj.objectKey,
                nestedObjectKey: {
                  ...testObj.objectKey.nestedObjectKey,
                  key4: 'overwritten',
                },
              },
            });
          });
        });
      });
    });
  });

  describe('#getTicket', () => {
    const ticketVal = 'thisIsTheFreakingTicket';
    const result = getTicket(`?param1=val1&param2=val2&ticket=${ticketVal}`);
    const expected = { ticket: ticketVal };

    testIfExists(result);
    shouldBeAnObject(result);

    it('should return the expected ticket value', () => {
      expect(result).to.deep.equal(expected);
    });
  });

  describe('#hasMethod', () => {
    const set = [
      ['given undefined value at `method`', { method: undefined }, false],
      ['given an empty object', {}, false],
      ['given a truthy value at `method`', { method: true }, true],
    ];

    set.forEach(test => testSet(test, hasMethod));
  });

  /**
   * These just test what will be the exported result of `queueFetch`, `umsFetch` etc...
   */
  namedApiFetchTest('queue');
  namedApiFetchTest('ums');

  describe('#fetchCallback', () => {
    const target = 'i am the one you seek';
    const url = 'http://www.testy-pants.com';
    const okResponse = {
      value: '{"data":"i am the one you seek"}',
      status: 200,
    };

    const noAuthResponse = {
      value: '{"data":"i am the one you seek"}',
      headers: {
        get(prop) {
          return prop === 'location' ? url : '';
        },
      },
      status: 401,
    };
    const testFetchHandler = data => data;

    describe('when passed a valid callback to handle response data', () => {
      const callback = fetchCallback(testFetchHandler);

      testIfExists(callback);
      shouldBeAFunction(callback);

      describe('when the resulting function is passed', () => {
        runErrorCases(callback);

        describe('a valid response object', () => {
          const result = callback(okResponse);

          shouldNotThrow(callback, okResponse);
          testIfExists(result);
          shouldBeAString(result);
          it('should correctly return the target property and process it', () => {
            expect(result).to.equal(target);
          });
        });

        describe('a 401 response object with location header', () => {
          const result = callback(noAuthResponse);

          testIfExists(result);
          shouldBeAnObject(result);
          it('should have a redirect_to key', () => {
            expect(result).to.have.all.keys('redirect_to');
          });

          it('should return the expected result', () => {
            expect(result).to.deep.equal({ redirect_to: url });
          });
        });
      });
    });
  });
});
