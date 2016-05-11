'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.umsFetch = exports.queueFetch = exports.encounterFetch = exports.issueFetch = exports.identityFetch = exports.namedApiFetchWrapper = exports.processParams = exports.defaultMethodToGet = exports.hasMethod = exports.fetchCallback = exports.statusFilter = exports.getRedirect = exports.getHeaders = exports.getFetchResponse = exports.getFetchData = exports.encodeResponse = exports.parseIfString = exports.parse = exports.statusWithinRange = exports.statusCodeLT = exports.statusCodeGTE = exports.statusCodeSatisfies = exports.statusIs = exports.getTicket = exports.createSetter = exports.createSelector = exports.createAction = undefined;
exports.createReducer = createReducer;
exports.reduceReducers = reduceReducers;

var _ramda = require('ramda');

var exists = (0, _ramda.compose)(_ramda.not, _ramda.isNil);
var emptyObject = (0, _ramda.always)({});
var getPropOrEmptyObjectFunction = (0, _ramda.propOr)(emptyObject);
var getPropOrEmptyString = (0, _ramda.propOr)('');
var secondArgument = (0, _ramda.nthArg)(1);

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
var typeIs = function typeIs(typeName) {
  return (0, _ramda.compose)((0, _ramda.equals)(typeName), _ramda.type, (0, _ramda.nthArg)(0));
};

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
var applyHandlerByType = (0, _ramda.cond)([[typeIs('Object'), _ramda.merge], [_ramda.T, secondArgument]]);

/**
 * Given a list of one or more action map objects, return a reducer function
 * to satisfy the reducer signature expected by redux core
 *
 * @param  {Object} actionMap   an object of pairs like {actionType: actionHandler}
 * @return {Function}           a reducer that calls the specified action map
 */
function createReducer(defaultState) {
  for (var _len = arguments.length, actionMaps = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    actionMaps[_key - 1] = arguments[_key];
  }

  var actionMap = (0, _ramda.mergeAll)(actionMaps);

  return function () {
    var state = arguments.length <= 0 || arguments[0] === undefined ? defaultState : arguments[0];
    var action = arguments[1];

    var actionType = getPropOrEmptyString('type', action);
    var actionTypeHandler = getPropOrEmptyObjectFunction(actionType, actionMap);

    return applyHandlerByType(state, actionTypeHandler(state, action));
  };
}

/**
 * Creates a single reducer from an n length list of reducers
 *
 * @param  {Function} reducers
 * @return {Function}
 */
function reduceReducers() {
  for (var _len2 = arguments.length, reducers = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    reducers[_key2] = arguments[_key2];
  }

  return function (previous, current) {
    return reducers.reduce(function (p, r) {
      return r(p, current);
    }, previous);
  };
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
var createAction = exports.createAction = function createAction(actionType) {
  return function () {
    var payload = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var meta = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    return { type: actionType, payload: payload, meta: meta };
  };
};

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
var getLens = (0, _ramda.ifElse)(_ramda.isArrayLike, _ramda.lensPath, _ramda.lensProp);

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
var createSelector = exports.createSelector = (0, _ramda.compose)(_ramda.memoize, _ramda.view, getLens);

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
var createSetter = exports.createSetter = (0, _ramda.compose)(_ramda.memoize, _ramda.set, getLens);

var splitParams = (0, _ramda.split)('&');
var splitParamPair = (0, _ramda.split)('=');
var containsTicket = (0, _ramda.test)(/ticket/);
var getTicketString = (0, _ramda.find)(containsTicket);
var makeParamObject = (0, _ramda.compose)(_ramda.fromPairs, _ramda.of);

/**
 * Takes the raw query string portion of a url and returns an equiv object
 * if the string contains a ticket param
 *
 * @param  {String}
 * @return {Object}
 */
var getTicket = exports.getTicket = (0, _ramda.compose)(makeParamObject, splitParamPair, getTicketString, splitParams);

/**
 * Status Code evaluation support functions
 */
var statusIs = exports.statusIs = (0, _ramda.propEq)('status');
var statusCodeSatisfies = exports.statusCodeSatisfies = function statusCodeSatisfies(predicate) {
  return (0, _ramda.compose)(predicate, (0, _ramda.prop)('status'));
};
var statusCodeGTE = exports.statusCodeGTE = (0, _ramda.compose)(statusCodeSatisfies, (0, _ramda.flip)(_ramda.gte));
var statusCodeLT = exports.statusCodeLT = (0, _ramda.compose)(statusCodeSatisfies, (0, _ramda.flip)(_ramda.lt));
var statusWithinRange = exports.statusWithinRange = (0, _ramda.curry)(function (l, h) {
  return (0, _ramda.and)(statusCodeGTE(l), statusCodeLT(h));
});

/**
 * Response handling support functions
 */
var parse = exports.parse = function parse(s) {
  return JSON.parse((0, _ramda.isEmpty)(s) ? '{}' : s);
};
var parseIfString = exports.parseIfString = (0, _ramda.ifElse)(typeIs('String'), parse, _ramda.identity);
var encodeResponse = exports.encodeResponse = (0, _ramda.compose)(parseIfString, (0, _ramda.prop)('value'));
var getFetchData = exports.getFetchData = createSelector('data');
var getFetchResponse = exports.getFetchResponse = (0, _ramda.compose)(getFetchData, encodeResponse);

var getHeaders = exports.getHeaders = function getHeaders(data) {
  return data.headers.get('location');
};
var getRedirect = exports.getRedirect = (0, _ramda.compose)((0, _ramda.objOf)('redirect_to'), getHeaders);

var statusFilter = exports.statusFilter = (0, _ramda.cond)([[statusIs(401), getRedirect], [statusWithinRange(200, 300), getFetchResponse]]);

/**
 * Returns a function that passes the value.data property expected fetch result
 * to the given callback function
 *
 * @param  {Function} func  the callback to pass data to
 * @return {Function}
 */
var fetchCallback = exports.fetchCallback = function fetchCallback(func) {
  return (0, _ramda.compose)(func, statusFilter);
};

/**
 * Mirror of the redux-effects-fetch action creator
 *
 * @param  {String} url
 * @param  {Object} params
 * @return {Object}
 */
var standardFetch = function standardFetch() {
  var url = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
  var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  return {
    type: 'EFFECT_FETCH',
    payload: {
      url: url,
      params: params
    }
  };
};

/**
 * Returns a headers object with a specific crosschx api name
 *
 * @param  {String} apiName
 * @return {Object}
 */
var headersWithNamedAccept = function headersWithNamedAccept(apiName) {
  return {
    headers: {
      Accept: 'application/x.' + apiName + '-api.1+json',
      'Content-Type': 'application/json',
      'cx-app': APP_NAME,
      'cx-app-version': APP_VERSION
    }
  };
};

var methodPath = ['method'];
var setMethod = createSetter(methodPath);
var hasMethod = exports.hasMethod = (0, _ramda.pathSatisfies)(exists, methodPath);

var defaultMethodToGet = exports.defaultMethodToGet = (0, _ramda.ifElse)(hasMethod, _ramda.identity, setMethod('GET'));

var processParams = exports.processParams = (0, _ramda.compose)(defaultMethodToGet, _ramda.merge);

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
var namedApiFetchWrapper = exports.namedApiFetchWrapper = function namedApiFetchWrapper(apiName) {
  return function (url) {
    var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var finalUrl = '/api/' + apiName + url;
    var headers = headersWithNamedAccept(apiName);
    var finalParams = processParams(params, headers);

    return standardFetch(finalUrl, finalParams);
  };
};

var identityFetch = exports.identityFetch = namedApiFetchWrapper('identity.api');
var issueFetch = exports.issueFetch = namedApiFetchWrapper('issue.service');
var encounterFetch = exports.encounterFetch = namedApiFetchWrapper('encounter.api');
var queueFetch = exports.queueFetch = namedApiFetchWrapper('queue.api');
var umsFetch = exports.umsFetch = namedApiFetchWrapper('ums.api');

exports.default = {
  createAction: createAction,
  createReducer: createReducer,
  createSelector: createSelector,
  createSetter: createSetter,
  encounterFetch: encounterFetch,
  fetchCallback: fetchCallback,
  getTicket: getTicket,
  hasMethod: hasMethod,
  identityFetch: identityFetch,
  issueFetch: issueFetch,
  queueFetch: queueFetch,
  umsFetch: umsFetch
};