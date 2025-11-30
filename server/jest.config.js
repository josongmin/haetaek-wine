export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'dao/**/*.js',
    '!**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};


