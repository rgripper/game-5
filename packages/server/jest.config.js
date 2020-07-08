const path = require('path');
console.log(__dirname)

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsConfig: path.join(__dirname, 'tsconfig.json')
    }
  },
  rootDir: path.join(__dirname, '../..'),
  testMatch: [path.join(__dirname, '/src/**/*.test.ts?(x)')],
  moduleFileExtensions: ['json', 'js', 'ts'],
};