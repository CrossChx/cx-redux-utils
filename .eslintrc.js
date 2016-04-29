module.exports = {
  'extends': 'airbnb',
  'parser': 'babel-eslint',
  'rules': {
    'no-param-reassign': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 1 : 0,
    'no-console': process.env.NODE_ENV === 'production' ? 1 : 0,
  },
  'env': {
    'mocha': true,
  },
};
