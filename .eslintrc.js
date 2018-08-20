module.exports = {
  "parser": "babel-eslint",
  "extends": ["eslint:recommended",],
  "plugins": ["jest", ],
  "parserOptions": {
    "ecmaVersion": 7,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true,
      "spread": true,
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "node": true,
    "jest/globals": true,
  },
};
