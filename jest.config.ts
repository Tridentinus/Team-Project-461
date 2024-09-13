import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
};

export default config;
