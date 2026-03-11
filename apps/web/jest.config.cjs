module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\.ts$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.app.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
