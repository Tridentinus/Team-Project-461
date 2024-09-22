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
      // Core TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn', // Quick scan for unused variables
      'no-undef': 'warn', // Prevent use of undefined variables
      '@typescript-eslint/no-redeclare': 'warn', // Prevent variable redeclaration
      'no-extra-semi': 'warn', // Check for unnecessary semicolons
      'no-constant-condition': 'warn', // Warn about constant conditions in control statements
      'no-console': 'off', // Allow console.log
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
      'no-unused-vars': 'warn', // Warn about unused variables
      'no-undef': 'warn', // Prevent use of undefined variables
      'no-redeclare': 'warn', // Prevent variable redeclaration
      'no-extra-semi': 'warn', // Check for unnecessary semicolons
      'no-constant-condition': 'warn', // Warn about constant conditions in control statements
      'no-console': 'off', // Allow console.log
    },
  },
];