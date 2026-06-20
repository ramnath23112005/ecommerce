module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@shared/(.*)': '<rootDir>/../shared/$1',
  },
  setupFilesAfterSetup: ['<rootDir>/src/tests/setup.ts'],
};
