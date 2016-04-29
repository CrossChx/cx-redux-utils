import {
  always,
  compose,
  cond,
  equals,
  ifElse, isArrayLike,
  lensPath,
  lensProp,
  memoize,
  merge, mergeAll,
  nthArg,
  propOr,
  set,
  T,
  type,
  view,
} from 'ramda';

const emptyString = always('');
const emptyObject = always({});
const emptyArray = always([]);
const getPropOrEmptyObjectFunction = propOr(emptyObject);
const getPropOrEmptyString = propOr('');
const firstArgument = nthArg(0);
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
 * Given the specified type, return a function that creates an object with a
 * specified type, and assign its arguments to a payload object
 *
 * @param  {String} type      redux action type name
 * @param  {Object} optional  payload for this action
 * @return {Function}         function that applys a payload and returns an
 *                            object of the given action type with the given
 *                            payload
 */
export const createAction = actionType => (payload = {}) => ({
  type: actionType,
  payload,
});

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


const getFetchData = createSelector(['value', 'data']);

/**
 * Returns a function that passes the value.data property expected fetch result
 * to the given callback function
 *
 * @param  {Function} func  the callback to pass data to
 * @return {Function}
 */
export const fetchCallback = func => compose(func, getFetchData);

export default {
  createReducer,
  createAction,
  createSelector,
  createSetter,
  fetchCallback,
};
