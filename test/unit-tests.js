import chai, { expect } from 'chai';

import asPromised from 'chai-as-promised';

import { namedApiFetchTest } from './namedApiFetchTest';

import {
  // Support functions
  getTicket,
  hasMethod,
  parseIfString,
  statusIs,
  statusCodeLT,
  statusCodeGTE,
  statusWithinRange,

  // Redux utils
  actionCreatorOrNew,
  createAction,
  createThunk,
  createHandler,
  createErrorAction,
  createErrorThunk,
  createReducer,
  createSelector,
  createSetter,
  fetchCallback,
  reduceReducers,
} from '../src/index';

import {
  shouldBeABoolean,
  shouldBeAFunction,
  shouldBeAnArray,
  shouldBeAnObject,
  shouldBeAString,
  shouldBeUndefined,
  shouldHaveKeys,
  shouldNotBeNull,
  shouldNotThrow,
  shouldThrow,
  testCases,
  testIfExists,
} from 'how-the-test-was-won';

chai.use(asPromised);

const runErrorCases = callback => {
  describe('an undefined argument', () => {
    shouldNotThrow(callback, undefined);
  });

  describe('a null argument', () => {
    shouldNotThrow(callback, null);
  });

  describe('an empty object', () => {
    shouldNotThrow(callback, {});
  });

  describe('an empty array', () => {
    shouldNotThrow(callback, []);
  });
};

/** @module tests */

describe('Support functions', () => {
  /** @name parseIfString */
  describe('#parseIfString', () => {
    const object = { data: 'i am the one you seek' };

    describe('given a json string', () => {
      const jsonString = '{"data":"i am the one you seek"}';
      const result = parseIfString(jsonString);

      testIfExists(result);
      shouldBeAnObject(result);
      it('should return a correct object', () => {
        expect(result).to.deep.equal(object);
      });
    });

    describe('given a javascript object', () => {
      const result = parseIfString(object);

      testIfExists(result);
      shouldBeAnObject(result);
      it('should return a correct object', () => {
        expect(result).to.deep.equal(object);
      });
    });

    shouldNotThrow(parseIfString, null);
    shouldNotThrow(parseIfString, undefined);
    shouldNotThrow(parseIfString, '');
  });

  /** @name hasMethod */
  describe('#hasMethod', () => {
    testCases(hasMethod,
      ['given undefined value at `method`', { method: undefined }, false],
      ['given an empty object', {}, false],
      ['given a truthy value at `method`', { method: true }, true],
    );
  });

  /** @name getTicket */
  describe('#getTicket', () => {
    const querystring = '?param1=val1&param2=val2';
    const ticketVal = 'thisIsTheFreakingTicket';

    describe('given a url querystring that contains a "ticket" param', () => {
      const result = getTicket(`${querystring}&ticket=${ticketVal}`);
      const expected = { ticket: ticketVal };

      testIfExists(result);
      shouldBeAnObject(result);

      it('should return the expected ticket value', () => {
        expect(result).to.deep.equal(expected);
      });
    });

    describe('given a url querystring that does not contain a "ticket" param', () => {
      const result = getTicket(querystring);
      const expected = { ticket: '' };

      testIfExists(result);
      shouldBeAnObject(result);
      shouldHaveKeys(result, 'ticket');
      it('should return a object with a "ticket" key and empty string', () => {
        expect(result).to.deep.equal(expected);
      });
    });
  });

  describe('#statusIs', () => {
    describe('when passed a status code', () => {
      const predicate = statusIs(200);

      testIfExists(predicate);
      shouldBeAFunction(predicate);

      describe('when the result is passed an object with a status key set to 200', () => {
        const result = predicate({ status: 200 });

        testIfExists(result);
        shouldBeABoolean(result);

        it('should return true', () => {
          expect(result).to.equal(true);
        });
      });

      describe('when the result is passed an object with a status key set to 300', () => {
        const result = predicate({ status: 300 });

        shouldBeABoolean(result);

        it('should return false', () => {
          expect(result).to.equal(false);
        });
      });
    });
  });

  describe('#statusCodeLT', () => {
    describe('when passed value of 10', () => {
      const lessThan = statusCodeLT(10);

      describe('when the resulting function is passed', () => {
        testCases(lessThan,
          [0, { status: 0 }, true],
          [5, { status: 5 }, true],
          [10, { status: 10 }, false],
          [11, { status: 11 }, false],
        );
      });
    });
  });

  describe('#statusCodeGTE', () => {
    const greaterThan = statusCodeGTE(10);

    describe('when the resulting function is passed', () => {
      testCases(greaterThan,
        [0, { status: 0 }, false],
        [5, { status: 5 }, false],
        [10, { status: 10 }, true],
        [11, { status: 11 }, true],
      );
    });
  });

  describe('#statusWithinRange', () => {
    describe('when passed a lower bound of 1 and an upper bound of 10', () => {
      const ranger = statusWithinRange(1, 10);

      testIfExists(ranger);
      shouldBeAFunction(ranger);

      describe('when the resulting function is passed', () => {
        testCases(ranger,
          [1, { status: 1 }, true],
          [2, { status: 2 }, true],
          [3, { status: 3 }, true],
          [11, { status: 11 }, false],
          [13, { status: 13 }, false],
          [15, { status: 15 }, false],
        );
      });
    });
  });
});

describe('Redux Utils', () => {
  const TEST_ACTION_TYPE = 'TEST_ACTION_TYPE';
  const dispatchedAction = {
    type: TEST_ACTION_TYPE,
    payload: { actionTestKey: 'actionTestValue' },
  };

  /** @name createReducer */
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

  /** @name reduceReducers */
  describe('#reduceReducers', () => {
    it('combines multiple reducers into a single reducer', () => {
      const reducer = reduceReducers(
        (prev, curr) => ({ ...prev, A: prev.A + curr }),
        (prev, curr) => ({ ...prev, B: prev.B * curr }),
      );

      expect(reducer({ A: 1, B: 2 }, 3)).to.deep.equal({ A: 4, B: 6 });
      expect(reducer({ A: 5, B: 8 }, 13)).to.deep.equal({ A: 18, B: 104 });
    });

    it('chains multiple reducers into a single reducer', () => {
      const addReducer = (prev, curr) => ({ ...prev, A: prev.A + curr });
      const multReducer = (prev, curr) => ({ ...prev, A: prev.A * curr });
      const reducerAddMult = reduceReducers(addReducer, multReducer);
      const reducerMultAdd = reduceReducers(multReducer, addReducer);

      expect(reducerAddMult({ A: 1, B: 2 }, 3)).to.deep.equal({ A: 12, B: 2 });
      expect(reducerMultAdd({ A: 1, B: 2 }, 3)).to.deep.equal({ A: 6, B: 2 });
    });
  });

  /** @name createAction */
  describe('#createAction', () => {
    describe('given the first arg (specified action Type)', () => {
      const creator = createAction(TEST_ACTION_TYPE);

      describe('the creator function returned', () => {
        testIfExists(creator);
        shouldBeAFunction(creator);
      });

      describe('given a payload passed to the function created, the result', () => {
        const payload = { testPayloadKey: 'testPayloadVal' };
        const meta = { testMetaKey: 'testMetaVal' };

        const createdAction = creator(payload, meta);

        testIfExists(createdAction);
        shouldBeAnObject(createdAction);

        it('should have a "type" and "payload" key', () => {
          expect(createdAction).to.contain.all.keys('type', 'payload', 'meta');
        });

        it('should have a "type" value of TEST_ACTION_TYPE', () => {
          expect(createdAction.type).to.equal(TEST_ACTION_TYPE);
        });

        it('should retain the payload passed to it', () => {
          expect(createdAction.payload).to.deep.equal(payload);
        });

        it('should retain the meta passed to it', () => {
          expect(createdAction.meta).to.deep.equal(meta);
        });
      });
    });
  });

  /** @name actionCreatorOrNew */
  describe('#actionCreatorOrNew', () => {
    const type = TEST_ACTION_TYPE;
    const payload = 'Oh Hai Mark';
    const expectedAction = { type, payload, meta: {} };

    describe('given a valid type', () => {
      const creator = actionCreatorOrNew(type);

      testIfExists(creator);
      shouldBeAFunction(creator);

      describe(`when invoked with the string ${payload}`, () => {
        const result = creator(payload);

        testIfExists(result);
        shouldBeAnObject(result);

        it('should return the expected action object', () => {
          expect(result).to.deep.equal(expectedAction);
        });
      });
    });

    describe('given a valid actionCreator', () => {
      const creator = createAction(type);
      const result = actionCreatorOrNew(creator);

      testIfExists(result);
      shouldBeAFunction(result);

      it('should return identity', () => {
        expect(result).to.equal(creator);
      });
    });
  });

  /** @name createThunk */
  describe('#createThunk', () => {
    describe('given the first arg (specified action Type)', () => {
      const creator = createThunk(TEST_ACTION_TYPE);

      describe('the creator function returned', () => {
        testIfExists(creator);
        shouldBeAFunction(creator);
      });

      describe('given a payload passed to the function created, the result', () => {
        const payload = { testPayloadKey: 'testPayloadVal' };
        const meta = { testMetaKey: 'testMetaVal' };

        const dispatch = d => d;
        const createdAction = creator(payload, meta);

        testIfExists(createdAction);
        shouldBeAFunction(createdAction);

        const createdActionResult = createdAction(dispatch);

        describe('when the resulting thunk is resolved it', () => {
          it('should be a promise', () => {
            expect(createdActionResult).to.be.a('promise');
          });

          it('should resolve with "type" value of TEST_ACTION_TYPE', () => {
            expect(createdActionResult).to.eventually.contain.all.keys([{
              type: TEST_ACTION_TYPE,
            }]);
          });

          it('should retain the meta passed to it', () => {
            expect(createdActionResult).to.eventually.contain.all.keys([{ meta }]);
          });

          it('should retain the payload passed to it', () => {
            expect(createdActionResult).to.eventually.contain.all.keys({ payload });
          });
        });
      });
    });
  });

  /** @name createErrorAction */
  describe('#createErrorAction', () => {
    describe('given the first arg (specified action Type)', () => {
      const message = 'this totally sucked';
      const creator = createErrorAction(TEST_ACTION_TYPE, message);

      describe('the creator function returned', () => {
        testIfExists(creator);
        shouldBeAFunction(creator);
      });

      describe('when a payload passed to the function created, the result', () => {
        const payload = { testPayloadKey: 'testPayloadVal' };
        const meta = { testMetaKey: 'testMetaVal' };

        const createdAction = creator(payload, meta);

        testIfExists(createdAction);
        shouldBeAnObject(createdAction);

        shouldHaveKeys(createdAction,
          'type',
          'meta',
          'error',
          'payload',
          'message',
        );

        it(`should have a "type" value of ${TEST_ACTION_TYPE}`, () => {
          expect(createdAction.type).to.equal(TEST_ACTION_TYPE);
        });

        it('should retain the payload passed to it', () => {
          expect(createdAction.payload).to.deep.equal(payload);
        });

        it('should retain the meta passed to it', () => {
          expect(createdAction.meta).to.deep.equal(meta);
        });

        it('should have an error key equal to true', () => {
          expect(createdAction.error).to.equal(true);
        });

        it(`should have an message key equal to ${message}`, () => {
          expect(createdAction.message).to.equal(message);
        });
      });

      describe('when a null payload is passed to the function created, the result', () => {
        const createdAction = creator(null, null);

        testIfExists(createdAction);
        shouldBeAnObject(createdAction);

        shouldHaveKeys(createdAction,
          'type',
          'meta',
          'error',
          'payload',
          'message',
        );

        it(`should have a "type" value of ${TEST_ACTION_TYPE}`, () => {
          expect(createdAction.type).to.equal(TEST_ACTION_TYPE);
        });

        it('should have an error key equal to true', () => {
          expect(createdAction.error).to.equal(true);
        });

        it(`should have an message key equal to ${message}`, () => {
          expect(createdAction.message).to.equal(message);
        });
      });
    });
  });

  /** @name createThunkError */
  describe('#createErrorThunk', () => {
    describe('given the first arg (specified action Type)', () => {
      const message = 'this totally sucked';
      const creator = createErrorThunk(TEST_ACTION_TYPE, message);

      describe('the creator function returned', () => {
        testIfExists(creator);
        shouldBeAFunction(creator);
      });

      describe('given a payload passed to the function created, the result', () => {
        const payload = { testPayloadKey: 'testPayloadVal' };
        const meta = { testMetaKey: 'testMetaVal' };

        const dispatch = d => d;
        const createdAction = creator(payload, meta);

        testIfExists(createdAction);
        shouldBeAFunction(createdAction);

        const createdActionResult = createdAction(dispatch);

        describe('when the resulting thunk is resolved it', () => {
          it('should be a promise', () => {
            expect(createdActionResult).to.be.a('promise');
          });

          it(`should resolve with "type" value of ${TEST_ACTION_TYPE}`, () => {
            expect(createdActionResult).to.eventually.contain.all.keys([{
              type: TEST_ACTION_TYPE,
            }]);
          });

          it('should retain the meta passed to it', () => {
            expect(createdActionResult).to.eventually.contain.all.keys([{ meta }]);
          });

          it('should retain the payload passed to it', () => {
            expect(createdActionResult).to.eventually.contain.all.keys({ payload });
          });

          it('should retain the message passed to it', () => {
            expect(createdActionResult).to.eventually.contain.all.keys({ message });
          });
        });
      });
    });
  });

  /** @name createHandler */
  describe('#createHandler', () => {
    const key = 'testKey';

    describe(`given the key ${key}`, () => {
      const handler = createHandler(key);

      testIfExists(handler);
      shouldBeAFunction(handler);

      describe('when the resulting function is passed a payload', () => {
        const state = {};
        const list = [1, 2, 3, 4];
        const action = { payload: { list } };
        const result = handler(state, action);

        testIfExists(result);
        shouldHaveKeys(result, key);
        it('should form the expected addition to existing state', () => {
          expect(result[key]).to.deep.equal({ list });
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

    /** @name createSelector */
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

    /** @name createSetter */
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

  /** @name fetchCallback */
  describe('#fetchCallback', () => {
    const testFetchHandler = (data, meta) => ({ data, meta });

    const data = 'i am the data you seek';
    const meta = 'i am the data about the data you seek';
    const url = 'http://www.testy-pants.com';

    const stringData = `"data":"${data}"`;
    const stringMeta = `"meta":"${meta}"`;

    const value = `{${stringData},${stringMeta}}`;
    const okResponse = { value, status: 200 };

    const noAuthResponse = {
      value,
      status: 401,
      headers: {
        get(prop) {
          return prop === 'location' ? url : '';
        },
      },
    };

    const testCallback = ({
      callback,
      keys,
      redirectResponse,
      returnObject,
    }) => {
      testIfExists(callback);
      shouldBeAFunction(callback);

      describe('when the resulting function is passed', () => {
        runErrorCases(callback);

        describe('a valid response object', () => {
          const result = callback(okResponse);

          shouldNotThrow(callback, okResponse);
          testIfExists(result);
          shouldBeAnObject(result);
          shouldHaveKeys(result, ...keys);

          it('should correctly return the data property and process it', () => {
            expect(result).to.deep.equal(returnObject);
          });
        });

        describe('a 401 response object with location header', () => {
          const result = callback(noAuthResponse);

          testIfExists(result);
          shouldBeAnObject(result);
          shouldHaveKeys(result, ...keys);

          it('should return the expected result', () => {
            expect(result).to.deep.equal(redirectResponse);
          });
        });
      });
    };

    describe('when passed a valid function to handle response data', () => {
      const callback = fetchCallback(testFetchHandler);
      const returnObject = { data, meta };
      const redirectResponse = { meta: {}, data: { redirect_to: url } };

      testCallback({
        callback,
        returnObject,
        redirectResponse,
        keys: ['data', 'meta'],
      });
    });

    describe('when passed a valid action type string', () => {
      const callback = fetchCallback(TEST_ACTION_TYPE);
      const returnObject = {
        type: TEST_ACTION_TYPE,
        payload: data,
        meta,
      };

      const redirectResponse = {
        type: TEST_ACTION_TYPE,
        payload: { redirect_to: 'http://www.testy-pants.com' },
        meta: {},
      };

      testCallback({
        callback,
        returnObject,
        redirectResponse,
        keys: ['type', 'payload', 'meta'],
      });
    });
  });

  /**
   * These just test what will be the exported result of `queueFetch`, `umsFetch` etc...
   * Mostly ensures that each api name does not cause any unforeseen string
   * concatenating issues
   */

  /** @name identityFetch */
  namedApiFetchTest('identity');

  /** @name issueFetch */
  namedApiFetchTest('issue');

  /** @name encounterFetch */
  namedApiFetchTest('encounter');

  /** @name queueFetch */
  namedApiFetchTest('queue');

  /** @name umsFetch */
  namedApiFetchTest('ums');

  /** @name umsFetch */
  namedApiFetchTest('crossway', '');
});
