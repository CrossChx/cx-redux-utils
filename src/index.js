import {
  always,
  and,
  compose,
  cond,
  curry,
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

/*
 * -----------------------------------------------------------------------------
 * Redux utilities
 * -----------------------------------------------------------------------------
 *
 * Reusable functions for implementing common redux patterns
 *
 * - createReducer(defaultState, actionMap1, actionMap2, and so on...)
 *
 * - createAction(TYPE)
 *
 * - createSelector('key') or createSelector(['path', 'to', 'key'])
 *
 * - createSetter('key') or createSetter(['path', 'to', 'key'])
 *
 */

/**
 * Type checker with array support
 * Use like `typeIs('Object', valToCheck)`
 *
 * @param  {String}   typeName  name of type to test for
 * @return {Function}           expects a final value to test for type match
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
 * @param  {*}      state         an initial state value of any type
 * @param  {Object} reducerResult the result of passing state and action to a
 *                                reducer function
 * @return {Function}             function that takes the two parameters noted above
 */
const applyHandlerByType = cond([
  [typeIs('Object'), merge],
  [T, secondArgument],
]);

/**
 * Given a list of one or more action map objects, return a reducer function
 * to satisfy the reducer signature expected by redux core
 *
 * @param  {Object} actionMap   an object of pairs like {actionType: actionHandler}
 * @return {Function}           a reducer that calls the specified action map
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
 * @param  {Function} reducers
 * @return {Function}
 */
export function reduceReducers(...reducers) {
  return (previous, current) =>
    reducers.reduce((p, r) => r(p, current), previous);
}

/**
 * Given the specified type, return a function that creates an object with a
 * specified type, and assign its arguments to a payload object
 *
 * @param  {String} type      redux action type name
 * @param  {Object} optional  payload for this action
 * @return {Function}         function that applys a payload and returns an
 *                            object of the given action type with the given
 *                            payload
 */
export const createAction = actionType =>
  (payload = {}, meta = {}) => ({ type: actionType, payload, meta });

/**
 * Returns a lens that focuses on a top level property if passed a string,
 * and a deep property if passed an array of strings for propPath
 *
 * Ex. 'key' for top level key,
 * or
 * ['response', 'data', 'createdAt'] for deep prop
 *
 * @param  {*} prop(s) an array for deep prop, or string for top level
 * @return {[type]}              [description]
 */
const getLens = ifElse(isArrayLike, lensPath, lensProp);

/**
 * Create a memoized (caches result of computing with any given argument)
 * function that finds and returns specified prop of an object.
 *
 * Pass a single string propName for top level key,
 * or an array of propNames for deep nested keys
 *
 * @param  {*}  prop(s) an array for deep prop, or string for top level
 * @return {Function}   used like `const valueISeek = thisSelector(objectToDigThrough)`
 */
export const createSelector = compose(memoize, view, getLens);

/**
 * Create a memoized (caches result of computing with any given argument)
 * function that returns a shallow copy of a given object, plus an
 * altered value according the prop it is focused on.
 *
 * Pass a single string propName for top level key,
 * or an array of propNames for deep nested keys
 *
 * @param  {*}  prop(s) an array for deep prop, or string for top level
 * @return {Function}   used like `const newVersionOfObject = thisSetter(newVal, objectToSetPropOn)`
 */
export const createSetter = compose(memoize, set, getLens);

const splitParams = split('&');
const splitParamPair = split('=');
const containsTicket = test(/ticket/);
const getTicketString = find(containsTicket);
const makeParamObject = compose(fromPairs, of);

/**
 * Takes the raw query string portion of a url and returns an equiv object
 * if the string contains a ticket param
 *
 * @param  {String}
 * @return {Object}
 */
export const getTicket = compose(
  makeParamObject,
  splitParamPair,
  getTicketString,
  splitParams,
);

/**
 * Status Code evaluation support functions
 */
export const statusIs = propEq('status');
export const statusCodeSatisfies = predicate => compose(predicate, prop('status'));
export const statusCodeGTE = compose(statusCodeSatisfies, flip(gte));
export const statusCodeLT = compose(statusCodeSatisfies, flip(lt));
export const statusWithinRange = curry(
  (l, h) => and(statusCodeGTE(l), statusCodeLT(h))
);

/**
 * Response handling support functions
 */
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
 * @param  {Function} func  the callback to pass data to
 * @return {Function}
 */
export const fetchCallback = func => compose(func, statusFilter);

/**
 * Mirror of the redux-effects-fetch action creator
 *
 * @param  {String} url
 * @param  {Object} params
 * @return {Object}
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
 * @param  {String} apiName
 * @return {Object}
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

export const defaultMethodToGet = ifElse(
  hasMethod,
  identity,
  setMethod('GET'),
);

export const processParams = compose(defaultMethodToGet, merge);

/**
 * Curryable function to wrap a redux-effects-fetch compliant action creator
 * with the name of a specific api to simplify api from dev perspective
 *
 * @param  {String} apiName name of the api will both prepend the url and add
 *                          to accept header
 * @param  {String} url     contextual url for api call
 * @param  {Object} params  params object for api call, body, method, etc..
 * @return {Object}         redux-effects-fetch compliant action creator invocation
 */
export const namedApiFetchWrapper =
  apiName => (url, params = {}) => {
    const finalUrl = `/api/${apiName}.api${url}`;
    const headers = headersWithNamedAccept(apiName);
    const finalParams = processParams(params, headers);

    return standardFetch(finalUrl, finalParams);
  };

export const identityFetch = namedApiFetchWrapper('identity');
export const queueFetch = namedApiFetchWrapper('queue');
export const umsFetch = namedApiFetchWrapper('ums');

export default {
  createAction,
  createReducer,
  createSelector,
  createSetter,
  fetchCallback,
  getTicket,
  hasMethod,
  identityFetch,
  queueFetch,
  umsFetch,
};
