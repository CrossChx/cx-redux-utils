'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.umsFetch = exports.queueFetch = exports.encounterFetch = exports.issueFetch = exports.identityFetch = exports.namedApiFetchWrapper = exports.processParams = exports.defaultMethodToGet = exports.hasMethod = exports.fetchCallback = exports.statusFilter = exports.getRedirect = exports.getHeaders = exports.getFetchResponse = exports.getFetchData = exports.encodeResponse = exports.parseIfString = exports.parse = exports.statusWithinRange = exports.statusCodeLT = exports.statusCodeGTE = exports.statusCodeComparator = exports.statusCodeSatisfies = exports.statusIs = exports.getTicket = exports.createSetter = exports.createSelector = exports.getLens = exports.createAction = undefined;
exports.createReducer = createReducer;
exports.reduceReducers = reduceReducers;

var _ramda = require('ramda');

var exists = (0, _ramda.compose)(_ramda.not, _ramda.isNil);
var emptyObject = (0, _ramda.always)({});
var getPropOrEmptyObjectFunction = (0, _ramda.propOr)(emptyObject);
var getPropOrEmptyString = (0, _ramda.propOr)('');
var secondArgument = (0, _ramda.nthArg)(1);

/**
 * Type checker with array support
 * Use like `typeIs('Object', valToCheck)`
 *
 * @ignore
 * @param  {String} typeName  name of type to test for
 * @param  {String} typeName  name of type to test for
 * @return {Boolean}          Expects a final value to test for type match
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
 * @ignore
 * @function
 * @param  {*}  state           initial state value of any type
 * @param  {*}  handlerResult   result of an action handler
 * @return {*}                  merged object Or handler result
 */
var applyHandlerByType = (0, _ramda.cond)([[typeIs('Object'), _ramda.merge], [_ramda.T, secondArgument]]);

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

/** @module actions */

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
var createAction = exports.createAction = function createAction(actionType) {
  return function () {
    var payload = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var meta = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    return { type: actionType, payload: payload, meta: meta };
  };
};

/**
 * Takes an optional payload and meta object and returns an object
 * that describes a redux action to be dispatched
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
var getLens = exports.getLens = (0, _ramda.ifElse)(_ramda.isArrayLike, _ramda.lensPath, _ramda.lensProp);

/**
 * Create a [memoized]{@link https://en.wikipedia.org/wiki/Memoization} function
 * that finds and returns specified property of an object. Uses ramda
 * [lensProp]{@link http://ramdajs.com/0.21.0/docs/#lensProp},
 * [lensPath]{@link http://ramdajs.com/0.21.0/docs/#lensPath},
 * [memoize]{@link http://ramdajs.com/0.21.0/docs/#memoize},
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
var createSelector = exports.createSelector = (0, _ramda.compose)(_ramda.memoize, _ramda.view, getLens);

/**
 * Create a [memoized]{@link https://en.wikipedia.org/wiki/Memoization}
 * function that returns a shallow copy of a given object, plus an
 * altered value according the property it is focused to. Uses ramda
 * [lensProp]{@link http://ramdajs.com/0.21.0/docs/#lensProp},
 * [lensPath]{@link http://ramdajs.com/0.21.0/docs/#lensPath},
 * [memoize]{@link http://ramdajs.com/0.21.0/docs/#memoize},
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
var createSetter = exports.createSetter = (0, _ramda.compose)(_ramda.memoize, _ramda.set, getLens);

var splitParams = (0, _ramda.split)('&');
var containsTicket = (0, _ramda.test)(/ticket/);
var makeParamObject = (0, _ramda.compose)(_ramda.fromPairs, _ramda.of);
var splitParamPair = (0, _ramda.compose)((0, _ramda.split)('='), (0, _ramda.defaultTo)(''));
var getTicketString = (0, _ramda.compose)((0, _ramda.defaultTo)('ticket='), (0, _ramda.find)(containsTicket), (0, _ramda.defaultTo)([]));

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
var getTicket = exports.getTicket = (0, _ramda.compose)(makeParamObject, splitParamPair, getTicketString, splitParams);

/** @module fetch */

// Status Code evaluation support functions
var statusIs = exports.statusIs = (0, _ramda.propEq)('status');
var statusCodeSatisfies = exports.statusCodeSatisfies = function statusCodeSatisfies(predicate) {
  return (0, _ramda.compose)(predicate, (0, _ramda.prop)('status'));
};
var statusCodeComparator = exports.statusCodeComparator = function statusCodeComparator(comp) {
  return (0, _ramda.compose)(statusCodeSatisfies, (0, _ramda.flip)(comp));
};
var statusCodeGTE = exports.statusCodeGTE = statusCodeComparator(_ramda.gte);
var statusCodeLT = exports.statusCodeLT = statusCodeComparator(_ramda.lt);
var statusWithinRange = exports.statusWithinRange = (0, _ramda.curry)(function (l, h) {
  return (0, _ramda.and)(statusCodeGTE(l), statusCodeLT(h));
});

// Response handling support functions
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
var fetchCallback = exports.fetchCallback = function fetchCallback(func) {
  return (0, _ramda.compose)(func, statusFilter);
};

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
var standardFetch = function standardFetch() {
  var url = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
  var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  return {
    type: 'EFFECT_FETCH',
    payload: { url: url, params: params }
  };
};

/**
 * Returns a headers object with a specific crosschx api name
 *
 * @ignore
 * @param  {String} apiName name of the api to be used, this will be inserted
 *                          in the 'Accept' header string
 * @return {Object}         A headers object intended to be merged in with a
 *                          provided or default params object
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
 * Manually curried function to return a redux-effects-fetch compliant action creator
 * with the name of a specific api and simplify usage from dev perspective
 *
 * @function
 * @see [tests]{@link module:namedApiFetchTest~test}
 * @param  {String}       apiName   name of the api will both prepend the url and
 *                                	add to accept header
 * @param  {String}       [suffix]  optional extension for the api name ex. `.api`
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
 * //    url: '/api/beast.api/beasts',
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
var namedApiFetchWrapper = exports.namedApiFetchWrapper = function namedApiFetchWrapper(apiName) {
  var suffix = arguments.length <= 1 || arguments[1] === undefined ? '.api' : arguments[1];
  return function (url) {
    var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var finalUrl = '/api/' + apiName + suffix + url;
    var headers = headersWithNamedAccept(apiName);
    var finalParams = processParams(params, headers);

    return standardFetch(finalUrl, finalParams);
  };
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
var identityFetch = exports.identityFetch = namedApiFetchWrapper('identity');

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
var issueFetch = exports.issueFetch = namedApiFetchWrapper('issue');

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
var encounterFetch = exports.encounterFetch = namedApiFetchWrapper('encounter');

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
var queueFetch = exports.queueFetch = namedApiFetchWrapper('queue');

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
var umsFetch = exports.umsFetch = namedApiFetchWrapper('ums');

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