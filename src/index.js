/* eslint-disable max-len */
import {
  allPass,
  always,
  and,
  compose,
  cond,
  converge,
  curry,
  defaultTo,
  equals,
  find,
  flip,
  fromPairs,
  gte,
  has,
  identity,
  ifElse,
  is,
  isArrayLike,
  isEmpty,
  isNil,
  lensPath,
  lt,
  merge,
  mergeAll,
  not,
  nthArg,
  objOf,
  of,
  or,
  path,
  pathSatisfies,
  prop,
  propEq,
  propOr,
  set,
  split,
  T,
  test,
  type,
  view,
} from 'ramda';

export { default as actionTestSuite } from './actionTest';

const isNilOrEmpty = or(isNil, isEmpty);
const notNil = compose(not, isNil);
const notEmpty = compose(not, isEmpty);
const exists = and(notEmpty, notNil);

const orEmptyObject = defaultTo({});

const emptyObject = always({});
const getPropOrEmptyObjectFunction = propOr(emptyObject);
const getPropOrEmptyString = propOr('');
const secondArgument = nthArg(1);

/**
 * Type checker with array support
 * Use like `typeIs('Object', valToCheck)`
 *
 * @ignore
 * @param  {String} typeName  name of type to test for
 * @param  {String} typeName  name of type to test for
 * @return {Boolean}          Expects a final value to test for type match
 */
const typeIs = typeName => compose(equals(typeName), type, nthArg(0));

/**
 * Merges state with reducer result in case of an object type
 * otherwise just returns the reducer result.
 *
 * If a different strategy is required for a type such as `Array`, an
 * additional pair may be added with like [typeIs('Array'), handler]
 * the handler will be passed the (state, reducerResult) signature
 * upon its predicate evaluating to true
 *
 * @ignore
 * @function
 * @param  {*}  state           initial state value of any type
 * @param  {*}  handlerResult   result of an action handler
 * @return {*}                  merged object Or handler result
 */
const applyHandlerByType = cond([
  [typeIs('Object'), merge],
  [T, secondArgument],
]);

/** @module reducers */

/**
 * Given a list of one or more action map objects, return a reducer function
 * to satisfy the reducer signature expected by redux core
 *
 * @see [tests]{@link module:test~createReducer}
 * @param  {Object}     defaultState  will be passed to the resulting reducer
 *                                    function the first time it is run
 * @param  {...Object}  actionMap     objects in which each key is an action
 *                                    types, and its value is an action handler
 *                                    functions that takes (state, action) as
 *                                    ordered arguments
 * @return {Function}                 A reducer function that handles each action
 *                                    type specified as a key in its action map
 *
 * @example
 * const defaultState = {
 *   people: 1,
 *   beasts: 1,
 * }
 *
 * const VANQUISH_BEAST = '@@/actionTypes/vanquishBeast';
 * function vanquishBeastHandler(state, action) {
 *   return {
 *     ...state,
 *     beasts: state.beasts - 1,
 *     weaponUsed: action.payload.weapon,
 *   }
 * }
 *
 * const SUCCUMB_TO_BEAST = '@@/actionTypes/succumbToBeast';
 * function succumbToBeastHandler(state, action) {
 *   return {
 *     ...state,
 *     people: state.people - 1,
 *     lastWords: action.payload.lastWords,
 *   }
 * }
 *
 * const reducer = createReducer(defaultState, {
 *   [VANQUISH_BEAST]: vanquishBeastHandler,
 *   [SUCCUMB_TO_BEAST]: succumbToBeastHandler,
 * })
 *
 * const vanquishBeast = createAction(VANQUISH_BEAST);
 * reducer({}, vanquishBeast({ weapon: 'broom' }))
 * //=> { people: 1, beasts: 0, weapon: 'broom' }
 *
 * const succumbToBeast = createAction(SUCCUMB_TO_BEAST);
 * reducer({}, succumbToBeast({ lastWords: 'tell my mom...' }))
 * //=> { people: 0, beasts: 1, lastWords: 'tell my mom...' }
 */
export function createReducer(defaultState, ...actionMaps) {
  const actionMap = mergeAll(actionMaps);

  return (state = defaultState, action) => {
    const actionType = getPropOrEmptyString('type', action);
    const actionTypeHandler = getPropOrEmptyObjectFunction(actionType, actionMap);

    return applyHandlerByType(state, actionTypeHandler(state, action));
  };
}

/**
 * Creates a single reducer from an n length list of reducers
 *
 * @see [tests]{@link module:test~reduceReducers}
 * @param  {...Function} reducers any number of reducer functions that take
 *                                (state, action) as ordered arguments
 * @return {Function}             A reducer function contstructed by merging
 *                                all given reducer functions
 *
 * @example
 * function reducerA(state, action) {
 *   return {
 *     ..state,
 *     a: action.payload,
 *   }
 * }
 *
 * function reducerB(state, action) {
 *   return {
 *     ..state,
 *     b: action.payload,
 *   }
 * }
 *
 * const combined = reduceReducers(reducerA, reducerB)
 * const defaultState = { sandwich: 'grilled cheese' }
 * const action = { payload: 'apply me' }
 *
 * combined(defaultState, action)
 * //=> { sandwich: 'grilled cheese', a: 'apply me', b: 'apply me' }
 */
export function reduceReducers(...reducers) {
  return (previous, current) =>
    reducers.reduce((p, r) => r(p, current), previous);
}

/** @module actions */

/**
 * Takes a type, optional message, optional payload value, and an optional meta value
 * and returns a standard redux action object descriptive of a redux action
 *
 * @function
 * @param   {String}  actionType  type string for action
 * @param   {*}       [payload]   data relevant to error
 * @param   {*}       [meta]      data to describe the payload
 * @returns {Object}              standard action object
 */
export const returnActionResult =
  (actionType, payload = {}, meta = {}) => ({
    type: actionType,
    payload: orEmptyObject(payload),
    meta: orEmptyObject(meta),
  });

/**
 * Given the specified type, return a function that creates an object with a
 * specified type, and assign its arguments to a payload object
 *
 * @function
 * @see [tests]{@link module:test~createAction}
 * @param  {String} type      redux action type name
 * @return {actionCreator}    [Action creator]{@link module:actions~actionCreator}
 *                            function that applys a payload and returns an object
 *                            of the given action type with the given payload
 *
 * @example
 * const BEGIN_GOOD_TIMES = '@@/actionTypes/gootTimes'
 * const beginGoodTimes = createAction(BEGIN_GOOD_TIMES);
 */
export const createAction = actionType =>
  (payload, meta) => returnActionResult(actionType, payload, meta);

export const createThunk = actionType =>
  (payload, meta) => dispatch =>
    Promise.resolve(dispatch(
      returnActionResult(actionType, payload, meta)
    ));

/**
 * Given any string key name, returns a function that takes a state and action and
 * returns a copy of the action's payload property renamed as the
 * specified key
 *
 * @function
 * @see [tests]{@link module:test~createHandler}
 * @param   {String}          key     name of payloads state destination key
 * @return  {handlerFunction}         A function that ignores current state and
 *                                    returns a copy of the action's payload
 *                                    property renamed as the specified key
 *
 * @example
 * const testHandler = createHandler('bananas');
 * const state = {};
 * const action = { payload: { list: [1, 2, 3, 4] } }
 *
 * testHandler(state, action)
 * //=> { bananas: [1, 2, 3, 4] }
 */
export const createHandler = key =>
  (state, { payload }) => ({ [key]: payload });

/**
 * Often a handler will have no need for the `state` value that is passed by
 * convention as the first arg to a handler function, or any key on the
 * action object other than `payload`. This function simply returns
 * the `payload` key of the second arg that is passed to it.
 *
 * @function
 * @param  {Object} state   current state of app (always ignored)
 * @param  {Object} action  the action being handled
 * @return {*}              the `payload` key of `action`
 *
 * @example
 * const uppercasePayload = compose(toUpper, getPayload)
 *
 * const action = { payload: 'i drink coffee please', type: 'COFFEE_ACTION' }
 * const state = { a: 1, b: 2, c: 3 }
 * uppercasePayload(state, action) //=> 'I DRINK COFFEE PLEASE'
 */
export const getPayload = compose(prop('payload'), nthArg(1));

/**
 * Function with a standard reducer signature of (state, action) and returns
 * a renamed copy of the action's payload property
 *
 * @name handlerFunction
 * @function
 * @param   {Object} state  current state
 * @param   {Object} action current action
 * @returns {Object}        renamed action.payload
 */

/**
 * Takes an optional payload and meta object and returns an object
 * that describes a redux action to be dispatched
 *
 * A empty object default functino is used for both meta and
 * payload to handle cases where a null is passed as either
 * rather than an undefined
 *
 * @name actionCreator
 * @function
 * @param  {Object} [payload] payload data this action
 * @param  {Object} [meta]    meta data for this action
 * @returns {Object}          includes a type string, and optional payload and meta objects
 *
 * @example
 *
 * const payload = { soundTrack: 'Jurrasic Park' }
 * beginGoodTimes(payload)
 * //=> {
 * //  type: '@@/actionTypes/gootTimes',
 * //  payload: { soundTrack: 'Jurrasic Park' },
 * //  meta: {},
 * //}
 *
 * const meta = { initiatedBy: 'Dr. Malcom' }
 * beginGoodTimes(payload, meta)
 * //=> {
 * //  type: '@@/actionTypes/gootTimes',
 * //  meta: { initiatedBy: 'Dr. Malcom' },
 * //  payload: { soundTrack: 'Jurrasic Park' },
 * //}
 */

/**
 * Takes a type, optional message, optional payload value, and an optional meta value
 * and returns a standard redux action object descriptive of a problem in execution
 *
 * @function
 * @param   {String}  actionType  type string for action
 * @param   {String}  [message]   description of the error
 * @param   {*}       [payload]   data relevant to error
 * @param   {*}       [meta]      data to describe the payload
 * @returns {Object}              standard action object
 */
export const returnErrorResult =
  (actionType, message = 'An error occurred', payload = {}, meta = {}) => ({
    type: actionType,
    error: true,
    message,
    payload: orEmptyObject(payload),
    meta: orEmptyObject(meta),
  });

/**
 * Given the specified type, and an optional custom error message, return a function
 * that creates an object with a specified type, adds an error: true key to the
 * top level, and assigns its arguments to a payload object
 *
 * @function
 * @see [tests]{@link module:test~createErrorAction}
 * @param  {String} type        redux action type name
 * @param  {String} [message]   a messge that describes the error, if none is given a
 *                            	generic message will be used
 * @return {errorActionCreator} [Action creator]{@link module:actions~actionCreator}
 *                              function that applys a payload and returns an object
 *                              of the given action type with the given payload
 *
 * @example
 * const BEGIN_GOOD_TIMES = '@@/actionTypes/gootTimes'
 * const beginGoodTimes = createAction(BEGIN_GOOD_TIMES);
 */
export const createErrorAction = (actionType, message) =>
  (payload, meta) => returnErrorResult(actionType, message, payload, meta);

export const createErrorThunk = (actionType, message) =>
  (payload, meta) => dispatch =>
    Promise.reject(dispatch(
      returnErrorResult(actionType, message, payload, meta)
    ));

/**
 * Takes an optional payload and returns an object
 * that describes an error redux action to be dispatched
 *
 * @name errorActionCreator
 * @function
 * @param  {Object} [payload] payload data this action
 * @returns {Object}          includes a type string, and optional payload and meta objects
 *
 * @example
 *
 * const payload = { soundTrack: 'Jurrasic Park' }
 * thisDidNotGoWell(payload)
 * //=> {
 * //  type: '@@/actionTypes/thisDidNotGoWell',
 * //  message: 'well something bad happened',
 * //  payload: { soundTrack: 'Jurrasic Park' },
 * //  error: true,
 * //}
 */

/**
 * Given an action and a type string, returns a boolean value to indicate that
 * the action has a type property equal to to the type string
 *
 * @function
 * @see [tests]{@link module:test~actionTypeIs}
 * @param  {Object} action  standard action object
 * @param  {String} type    any string
 * @return {Boolean}        true if action.type === type
 *
 * @example
 * const type = 'test'
 * const action = { type }
 *
 * actionTypeIs(action, 'test')
 * //=> true
 *
 * actionTypeIs(action, 'blah')
 * //=> false
 *
 * const thunk = () => {}
 * actionTypeIs(thunk, 'test')
 * //=> false
 *
 * actionTypeIs({}, 'test')
 * //=> false
 */
export const actionTypeIs = curry(
  (action, actionType) => compose(equals(actionType), path(['type']))(action)
);

/** @module lenses */

/**
 * Wraps ramda's [lensProp]{@link http://ramdajs.com/0.21.0/docs/#lensProp} and
 * [lensPath]{@link http://ramdajs.com/0.21.0/docs/#lensPath} to return a lens
 * that focuses on a top level property if passed a string, and a deep property
 * if passed an array of strings for propPath
 *
 * @function
 * @see [tests]{@link module:test~getLens}
 * @param  {(String|String[])} path an array for deep prop, or string for top level
 * @return {Function}
 *
 * @example
 * import { view, set } from 'ramda'
 *
 * const aLens = getLens('a')
 * const simpleObj = { a: 'rumble in the bronx', b: 'I like turtles' }
 * view(aLens, simpleObj) //=> 'rumble in the bronx'
 *
 * const cLens = getLens(['a', 'b', 'c'])
 * const nestedObj = { a: { b: { c: 'I am bored' } } }
 * set(cLens, 'it is party time', nestedObj)
 * //=> { a: { b: { c: 'it is party time' } } }
 */
export const getLens = ifElse(isArrayLike, lensPath, compose(lensPath, of));

/**
 * Create a [memoized]{@link https://en.wikipedia.org/wiki/Memoization} function
 * that finds and returns specified property of an object. Uses ramda
 * [lensPath]{@link http://ramdajs.com/0.21.0/docs/#lensPath},
 * and [view]{@link http://ramdajs.com/0.21.0/docs/#view} internally
 *
 * Pass a single string propName for top level key,
 * or an array of propNames for deep nested keys
 *
 * @function
 * @see [tests]{@link module:test~createSelector}
 * @param  {(String|String[])}  path  an array for deep prop, or string for top level
 * @return {Function}                 function that returns the value of a property
 *                                    at the specified path
 *
 * @example
 * const getA = createSelector('a')
 * const simpleObj = { a: 'rumble in the bronx', b: 'I like turtles' }
 * getA(simpleObj) //=> 'rumble in the bronx'
 *
 * const getC = createSelector(['a', 'b', 'c'])
 * const nestedObj = { a: { b: { c: 'rumble in the bronx' } } }
 * getC(nestedObj) //=> 'rumble in the bronx'
 */
export const createSelector = compose(view, getLens);

/**
 * Create a [memoized]{@link https://en.wikipedia.org/wiki/Memoization}
 * function that returns a shallow copy of a given object, plus an
 * altered value according the property it is focused to. Uses ramda
 * [lensPath]{@link http://ramdajs.com/0.21.0/docs/#lensPath},
 * and [set]{@link http://ramdajs.com/0.21.0/docs/#set} internally
 *
 * Pass a single string propName for top level key,
 * or an array of propNames for deep nested keys
 *
 * @function
 * @see [tests]{@link module:test~createSetter}
 * @param  {(String|String[])} path   an array of strings for a deep property, or
 *                                    string for top level property
 * @return {Function}                 function that returns a clone of an object with a new
 *                                    value set to the property at the specified path
 * @example
 * const newVal = 'it is party time'
 *
 * const setA = createSetter('a')
 * const obj = { a: 'I am bored', b: 'I like turtles' }
 * setA(newVal, obj) //=> { a: 'it is party time', b: 'I like turtles' }
 *
 * const setC = createSetter(['a', 'b', 'c'])
 * const obj = { a: { b: { c: 'I am bored' } } }
 * setC(newVal, obj) //=> { a: { b: { c: 'it is party time' } } }
 */
export const createSetter = compose(set, getLens);

const splitParams = split('&');
const containsTicket = test(/ticket/);
const makeParamObject = compose(fromPairs, of);
const splitParamPair = compose(
  split('='),
  defaultTo('')
);
const getTicketString = compose(
  defaultTo('ticket='),
  find(containsTicket),
  defaultTo([])
);

/**
 * Takes the query string portion of a url usually obtained with the
 * [search property]{@link http://www.w3schools.com/jsref/prop_loc_search.asp}
 * of js [location]{@link https://developer.mozilla.org/en-US/docs/Web/API/Location}
 * and returns an object with a `ticket` key value pair
 *
 * @function
 * @see [tests]{@link module:test~getTicket}
 * @param  {String} standard  querystring of a url (anything after '?' character)
 * @return {Object}           An object with a single key 'ticket' that contains
 *                            the ticket param value, or an empty string if no
 *                            ticket param was found in the querystring
 *
 * @example
 * const query = '?flicket=balloon&ticket=mufasa'
 * getTicket(query) //=> { ticket: 'mufasa' }
 *
 * const query = '?flicket=balloon&plicket=mufasa'
 * getTicket(query) //=> { ticket: '' }
 */
export const getTicket = compose(
  makeParamObject,
  splitParamPair,
  getTicketString,
  splitParams
);

/** @module fetch */

// Status Code evaluation support functions
export const statusIs = propEq('status');
export const statusCodeSatisfies = predicate => compose(predicate, prop('status'));
export const statusCodeComparator = comp => compose(statusCodeSatisfies, flip(comp));
export const statusCodeGTE = statusCodeComparator(gte);
export const statusCodeLT = statusCodeComparator(lt);
export const statusWithinRange = curry((lowestCode, hightestCode) =>
  and(statusCodeGTE(lowestCode), statusCodeLT(hightestCode))
);

// Response handling support functions
export const parse = x => JSON.parse(isEmpty(x) ? '{}' : x);
export const parseIfString = ifElse(typeIs('String'), parse, identity);
export const encodeResponse = compose(parseIfString, prop('value'));
export const getHeaders = data => data.headers.get('location');
export const getRedirect = compose(objOf('redirect_to'), getHeaders);

export const statusFilter = cond([
  [isNilOrEmpty, emptyObject],
  [statusIs(401), getRedirect],
  [statusWithinRange(200, 300), encodeResponse],
]);

export const actionCreatorOrNew = ifElse(is(Function), identity, createAction);

const isResponseObj = allPass([typeIs('Object'), has('data')]);
const safeData = ifElse(isResponseObj, path(['data']), identity);
const safeMeta = propOr({}, 'meta');
/**
 * Returns a function that passes the value.data property expected fetch result
 * to the given callback function
 *
 * @function
 * @see [tests]{@link module:test~fetchCallback}
 * @param  {Function} func  the callback to pass data to
 * @return {Function}       a function handles status codes appropriately and
 *                            delivers the value.data property to its callback
 *
 * @example
 * import { sum } from 'ramda'
 *
 * const apiResponse = {
 *   status: 200,
 *   value: {
 *     data: {
 *       numbers: [1, 2, 3]
 *     },
 *     meta: {
 *       numbers: [1, 2, 3]
 *     },
 *   },
 * }
 *
 * const addNumbers = data => sum(data.numbers)
 * const addNumbersCallback = fetchCallback(addNumbers)
 *
 * addNumbersCallback(apiResponse)
 * //=> 6
 *
 * const addNumbersWithMeta = (data, meta) => sum([...data.numbers, ...meta.numbers])
 * const addNumbersWithMetaCallback = fetchCallback(addNumbersWithMeta)
 *
 * addNumbersWithMetaCallback(apiResponse)
 * //=> 12
 */
export const fetchCallback = func => compose(
  converge(actionCreatorOrNew(func), [safeData, safeMeta]),
  statusFilter,
);

/**
 * A standard fetch request params object
 *
 * @typedef   {Object} ParamsObject
 * @property  {Object} params.body     data used in post or put request
 * @property  {String} params.method   rest verb 'GET', 'POST' etc...
 * @property  {Object} params.headers  headers object
 */

/**
 * Redux action object compatible with [redux-effects-fetch]{@link https://goo.gl/bG7PO0}
 * with a type of 'EFFECT_FETCH', and a payload that describes a
 * [fetch]{@link https://goo.gl/DeFc1M} call.
 *
 * @typedef   {Object}  FetchAction
 * @property  {String}  url         the request url for fetch call
 * @property  {ParamsObject} params the request params for fetch call
 */

/**
 * Mirror of the [redux-effects-fetch action creator]{@link https://goo.gl/bG7PO0}
 *
 * @ignore
 * @param  {String}       url     url to send request to
 * @param  {ParamsObject} params  a standard params object
 * @return {FetchAction}          [Fetch action object]{@link module:fetch~FetchAction}
 *                                with a payload that describes a [fetch]{@link https://goo.gl/DeFc1M}
 *                                call
 */
const standardFetch = (url = '', params = {}) => ({
  type: 'EFFECT_FETCH',
  payload: { url, params },
});

/**
 * Returns a headers object with a specific crosschx api name
 *
 * @ignore
 * @param  {String} apiName name of the api to be used, this will be inserted
 *                          in the 'Accept' header string
 * @return {Object}         A headers object intended to be merged in with a
 *                          provided or default params object
 */
const headersWithNamedAccept = apiName => ({
  headers: {
    Accept: `application/x.${apiName}-api.1+json`,
    'Content-Type': 'application/json',
    'cx-app': APP_NAME,
    'cx-app-version': APP_VERSION,
  },
});

const methodPath = ['method'];
const setMethod = createSetter(methodPath);
export const hasMethod = pathSatisfies(exists, methodPath);
export const defaultMethodToGet = ifElse(hasMethod, identity, setMethod('GET'));
export const processParams = compose(defaultMethodToGet, merge);

/**
 * Manually curried function to return a redux-effects-fetch compliant action creator
 * with the name of a specific api and simplify usage from dev perspective
 *
 * @function
 * @see [tests]{@link module:namedApiFetchTest~test}
 * @param  {String}       apiName   name of the api will both prepend the url and
 *                                	add to accept header
 * @param  {String}       [suffix]  optional extension for the api name ex. `-api`
 * @param  {String}       url       contextual url for request
 * @param  {ParamsObject} params    [params object]{@link module:fetch~ParamsObject} for api
 *                                  call, body, method, etc..
 * @return {FetchAction}            [Fetch action object]{@link module:fetch~FetchAction}
 *                                  with url prefix and headers for encounter api
 *
 * @example
 * const beastFetch = namedApiFetchWrapper('test')
 *
 * beastFetch('/beasts', {
 *   method: 'POST',
 *   body: {
 *     beastType: 'manticore'
 *     researchUrl: 'https://en.wikipedia.org/wiki/Manticore',
 *   },
 * })
 * //=> {
 * //  type: 'EFFECT_FETCH',
 * //  payload: {
 * //    url: '/api/beast-api/beasts',
 * //    params: {
 * //      method: 'POST',
 * //      body: {
 * //        beastType: 'manticore'
 * //        researchUrl: 'https://en.wikipedia.org/wiki/Manticore',
 * //      },
 * //    	 headers: {
 * //    	   Accept: 'application/x.beast-api.1+json',
 * //    	   'Content-Type': 'application/json',
 * //        'cx-app': <from global namespace>,
 * //        'cx-app-version': <from global namespace>,
 * //    	 },
 * //    },
 * //  },
 * //}
 */
export const namedApiFetchWrapper =
  (apiName, suffix = '-api') => (url, params = {}) => {
    const finalUrl = `/api/${apiName}${suffix}${url}`;
    const headers = headersWithNamedAccept(apiName);
    const finalParams = processParams(params, headers);

    return standardFetch(finalUrl, finalParams);
  };

/**
 * Takes a url and params object like the [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
 * adds a url prefix and headers for identity api
 *
 * @function
 * @param  {String} url           fetch call is sent to this url
 * @param  {ParamsObject} params  A standard [params object]{@link module:fetch~ParamsObject}
 * @return {FetchAction}          A standard [fetch action object]{@link module:fetch~FetchAction}
 *                                with url prefix and headers for identity api
 */
export const identityFetch = namedApiFetchWrapper('identity');

/**
 * Takes a url and [params object]{@link module:fetch~ParamsObject} like the
 * [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
 * adds a url prefix and headers for issue api
 *
 * @function
 * @param  {String} url           fetch call is sent to this url
 * @param  {ParamsObject} params  A standard [params object]{@link module:fetch~ParamsObject}
 * @return {FetchAction}          A standard [fetch action object]{@link module:fetch~FetchAction}
 *                                with url prefix and headers for issue api
 */
export const issueFetch = namedApiFetchWrapper('issue');

/**
 * Takes a url and [params object]{@link module:fetch~ParamsObject} like the
 * [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
 * adds a url prefix and headers for encounter api
 *
 * @function
 * @param  {String} url           fetch call is sent to this url
 * @param  {ParamsObject} params  A standard [params object]{@link module:fetch~ParamsObject}
 * @return {FetchAction}          A standard [fetch action object]{@link module:fetch~FetchAction}
 *                                with url prefix and headers for encounter api
 */
export const encounterFetch = namedApiFetchWrapper('encounter');

/**
 * Takes a url and [params object]{@link module:fetch~ParamsObject} like the
 * [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
 * adds a url prefix and headers for queue api
 *
 * @function
 * @param  {String} url           fetch call is sent to this url
 * @param  {ParamsObject} params  A standard [params object]{@link module:fetch~ParamsObject}
 * @return {FetchAction}          A standard [fetch action object]{@link module:fetch~FetchAction}
 *                                with url prefix and headers for queue api
 */
export const queueFetch = namedApiFetchWrapper('queue');

/**
 * Takes a url and [params object]{@link module:fetch~ParamsObject} like the
 * [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
 * adds a url prefix and headers for company api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {ParamsObject} params    A standard [params object]{@link module:fetch~ParamsObject}
 * @return {FetchAction}            A standard [fetch action object]{@link module:fetch~FetchAction}
 *                                  with url prefix and headers for company api
 */

export const companyFetch = namedApiFetchWrapper('company');

/**
 * Takes a url and [params object]{@link module:fetch~ParamsObject} like the
 * [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
 * adds a url prefix and headers for biometrics api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {ParamsObject} params    A standard [params object]{@link module:fetch~ParamsObject}
 * @return {FetchAction}            A standard [fetch action object]{@link module:fetch~FetchAction}
 *                                  with url prefix and headers for company api
 */

export const biometricFetch = namedApiFetchWrapper('biometric');

 /**
  * Takes a url and [params object]{@link module:fetch~ParamsObject} like the
  * [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
  * adds a url prefix and headers for ums api
  *
  * @function
  * @param  {String} url             fetch call is sent to this url
  * @param  {ParamsObject} params    A standard [params object]{@link module:fetch~ParamsObject}
  * @return {FetchAction}            A standard [fetch action object]{@link module:fetch~FetchAction}
  *                                  with url prefix and headers for ums api
  */

export const umsFetch = namedApiFetchWrapper('ums');

/**
 * Takes a url and [params object]{@link module:fetch~ParamsObject} like the
 * [standard fetch action creator]{@link https://goo.gl/b3P3BJ}, but
 * adds a url prefix and headers for crossway api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {ParamsObject} params    A standard [params object]{@link module:fetch~ParamsObject}
 * @return {FetchAction}            A standard [fetch action object]{@link module:fetch~FetchAction}
 *                                  with url prefix and headers for crossway api
 */
export const crosswayFetch = namedApiFetchWrapper('crossway', '');

export default {
  returnActionResult,
  createAction,
  createThunk,
  returnErrorResult,
  createErrorAction,
  createErrorThunk,
  getLens,
  createSelector,
  createSetter,
  getTicket,
  statusIs,
  statusCodeSatisfies,
  statusCodeComparator,
  statusCodeGTE,
  statusCodeLT,
  statusWithinRange,
  parse,
  parseIfString,
  encodeResponse,
  getHeaders,
  getRedirect,
  statusFilter,
  fetchCallback,
  hasMethod,
  defaultMethodToGet,
  processParams,
  namedApiFetchWrapper,
  identityFetch,
  issueFetch,
  encounterFetch,
  queueFetch,
  companyFetch,
  biometricFetch,
  umsFetch,
  crosswayFetch,
};
