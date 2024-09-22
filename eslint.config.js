// eslint.config.js
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'], // Specify the files to apply this config
    languageOptions: {
      parser: typescriptParser, // Specify the ESLint parser for TypeScript
      parserOptions: {
        ecmaVersion: 2021, // Allow modern ECMAScript features
        sourceType: 'module', // Allow the use of ES modules
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off'
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'], // Specify the files to apply this config for JavaScript
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021, // Allow modern ECMAScript features
        sourceType: 'module', // Allow the use of ES modules
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'consistent-return': 'warn',
      'prefer-const': 'warn',
      'no-console': 'off',
    },
  },
];