import {
  always,
  and,
  compose,
  cond,
  curry,
  defaultTo,
  equals,
  find,
  flip,
  fromPairs,
  gte,
  identity,
  ifElse,
  isEmpty,
  isArrayLike,
  isNil,
  lensPath,
  lensProp,
  lt,
  memoize,
  merge,
  mergeAll,
  not,
  nthArg,
  objOf,
  of,
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

const exists = compose(not, isNil);
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

/** @module redux-utils */

/**
 * Given a list of one or more action map objects, return a reducer function
 * to satisfy the reducer signature expected by redux core
 *
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

/**
 * Given the specified type, return a function that creates an object with a
 * specified type, and assign its arguments to a payload object
 *
 * @function
 * @param  {String} type      redux action type name
 * @param  {Object} [payload]   payload data this action
 * @param  {Object} [meta]   meta data for this action
 * @return {Function}         Function that applys a payload and returns an
 *                            object of the given action type with the given
 *                            payload
 *
 * @example
 * const BEGIN_GOOD_TIMES = '@@/actionTypes/gootTimes'
 * const beginGoodTimes = createAction(BEGIN_GOOD_TIMES);
 *
 * beginGoodTimes({ soundTrack: 'Jurrasic Park' })
 * //=> {
 * //  type: '@@/actionTypes/gootTimes',
 * //  payload: { soundTrack: 'Jurrasic Park' },
 * //  meta: {},
 * //}
 *
 * beginGoodTimes(
 *   { soundTrack: 'Jurrasic Park' },
 *   { initiatedBy: 'Dr. Malcom' },
 * )
 * //=> {
 * //  type: '@@/actionTypes/gootTimes',
 * //  meta: { initiatedBy: 'Dr. Malcom' },
 * //  payload: { soundTrack: 'Jurrasic Park' },
 * //}
 */
export const createAction = actionType =>
  (payload = {}, meta = {}) => ({ type: actionType, payload, meta });

/**
 * Wraps ramda's [lensProp]{@link http://ramdajs.com/0.21.0/docs/#lensProp} and
 * [lensPath]{@link http://ramdajs.com/0.21.0/docs/#lensPath} to return a lens
 * that focuses on a top level property if passed a string, and a deep property
 * if passed an array of strings for propPath
 *
 * Ex. 'key' for top level key,
 * or
 * ['response', 'data', 'createdAt'] for deep prop
 * @function
 * @param  {*} prop(s) an array for deep prop, or string for top level
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
export const getLens = ifElse(isArrayLike, lensPath, lensProp);

/**
 * Create a [memoized]{@link https://en.wikipedia.org/wiki/Memoization} function
 * that finds and returns specified prop of an object.
 *
 * Pass a single string propName for top level key,
 * or an array of propNames for deep nested keys
 *
 * @function
 * @param  {(String|String[])}  props an array for deep prop, or string for top level
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
export const createSelector = compose(memoize, view, getLens);

/**
 * Create a [memoized]{@link https://en.wikipedia.org/wiki/Memoization}
 * function that returns a shallow copy of a given object, plus an
 * altered value according the prop it is focused on.
 *
 * Pass a single string propName for top level key,
 * or an array of propNames for deep nested keys
 *
 * @function
 * @param  {(String|String[])} props an array of strings for a deep property, or
 *                                   string for top level property
 * @return {Function}                function that returns a clone of an object with a new
 *                                   value set to the property at the specified path
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
export const createSetter = compose(memoize, set, getLens);

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

/**
 * @module fetch-utils
 */

// Status Code evaluation support functions
export const statusIs = propEq('status');
export const statusCodeSatisfies = predicate => compose(predicate, prop('status'));
export const statusCodeComparator = comp => compose(statusCodeSatisfies, flip(comp));
export const statusCodeGTE = statusCodeComparator(gte);
export const statusCodeLT = statusCodeComparator(lt);
export const statusWithinRange = curry(
  (l, h) => and(statusCodeGTE(l), statusCodeLT(h))
);

// Response handling support functions
export const parse = s => JSON.parse(isEmpty(s) ? '{}' : s);
export const parseIfString = ifElse(typeIs('String'), parse, identity);
export const encodeResponse = compose(parseIfString, prop('value'));
export const getFetchData = createSelector('data');
export const getFetchResponse = compose(getFetchData, encodeResponse);

export const getHeaders = data => data.headers.get('location');
export const getRedirect = compose(objOf('redirect_to'), getHeaders);

export const statusFilter = cond([
  [statusIs(401), getRedirect],
  [statusWithinRange(200, 300), getFetchResponse],
]);

/**
 * Returns a function that passes the value.data property expected fetch result
 * to the given callback function
 *
 * @function
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
 *     data: { numbers: [1, 2, 3] },
 *   },
 * }
 *
 * const addNumbers = data => sum(data.numbers)
 * const addNumbersCallback = fetchCallback(addNumbers)
 *
 * addNumbersCallback(apiResponse)
 * //=> 6
 */
export const fetchCallback = func => compose(func, statusFilter);

/**
 * Mirror of the redux-effects-fetch action creator
 *
 * @ignore
 * @param  {String} url     url to send request to
 * @param  {Object} params  a standard params object consisting of method,
 *                          body, headers, etc..
 * @return {Object}         Standard action object
 */
const standardFetch = (url = '', params = {}) => ({
  type: 'EFFECT_FETCH',
  payload: {
    url,
    params,
  },
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
 * Curryable function to wrap a redux-effects-fetch compliant action creator
 * with the name of a specific api to simplify api from dev perspective
 *
 * @function
 * @param  {String} apiName   name of the api will both prepend the url and add
 *                            to accept header
 * @param  {String} [suffix]  optional extension for the api name ex. `.api`
 * @param  {String} url       contextual url for request
 * @param  {Object} params    params object for api call, body, method, etc..
 * @return {Object}           Redux-effects-fetch compliant action creator invocation
 */
export const namedApiFetchWrapper =
  (apiName, suffix = '.api') => (url, params = {}) => {
    const finalUrl = `/api/${apiName}${suffix}${url}`;
    const headers = headersWithNamedAccept(apiName);
    const finalParams = processParams(params, headers);

    return standardFetch(finalUrl, finalParams);
  };

/** @module fetch-action-creators */

/**
 * Takes a url and params object like the [standard fetch action creator]{@link https://github.com/redux-effects/redux-effects-fetch#actions}, but
 * adds a url prefix and headers for identity api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {Object} params          params object for request
 * @param  {Object} params.body     data used in post or put request
 * @param  {String} params.method   rest verb 'GET', 'POST' etc...
 * @param  {Object} params.headers  headers object
 * @return {Object}                 A standard fetch action object with url
 *                                  prefix and headers for identity api
 */
export const identityFetch = namedApiFetchWrapper('identity');

/**
 * Takes a url and params object like the [standard fetch action creator]{@link https://github.com/redux-effects/redux-effects-fetch#actions}, but
 * adds a url prefix and headers for issue api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {Object} params          params object for request
 * @param  {Object} params.body     data used in post or put request
 * @param  {String} params.method   rest verb 'GET', 'POST' etc...
 * @param  {Object} params.headers  headers object
 * @return {Object}                 A standard fetch action object with url
 *                                  prefix and headers for issue api
 */
export const issueFetch = namedApiFetchWrapper('issue');

/**
 * Takes a url and params object like the [standard fetch action creator]{@link https://github.com/redux-effects/redux-effects-fetch#actions}, but
 * adds a url prefix and headers for encounter api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {Object} params          params object for request
 * @param  {Object} params.body     data used in post or put request
 * @param  {String} params.method   rest verb 'GET', 'POST' etc...
 * @param  {Object} params.headers  headers object
 * @return {Object}                 A standard fetch action object with url
 *                                  prefix and headers for encounter api
 */
export const encounterFetch = namedApiFetchWrapper('encounter');

/**
 * Takes a url and params object like the [standard fetch action creator]{@link https://github.com/redux-effects/redux-effects-fetch#actions}, but
 * adds a url prefix and headers for queue api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {Object} params          params object for request
 * @param  {Object} params.body     data used in post or put request
 * @param  {String} params.method   rest verb 'GET', 'POST' etc...
 * @param  {Object} params.headers  headers object
 * @return {Object}                 A standard fetch action object with url
 *                                  prefix and headers for queue api
 */
export const queueFetch = namedApiFetchWrapper('queue');

/**
 * Takes a url and params object like the [standard fetch action creator]{@link https://github.com/redux-effects/redux-effects-fetch#actions}, but
 * adds a url prefix and headers for ums api
 *
 * @function
 * @param  {String} url             fetch call is sent to this url
 * @param  {Object} params          params object for request
 * @param  {Object} params.body     data used in post or put request
 * @param  {String} params.method   rest verb 'GET', 'POST' etc...
 * @param  {Object} params.headers  headers object
 * @return {Object}                 A standard fetch action object with url
 *                                  prefix and headers for ums api
 */
export const umsFetch = namedApiFetchWrapper('ums');

export default {
  createAction,
  createReducer,
  createSelector,
  createSetter,
  encounterFetch,
  fetchCallback,
  getTicket,
  hasMethod,
  identityFetch,
  issueFetch,
  queueFetch,
  umsFetch,
};
