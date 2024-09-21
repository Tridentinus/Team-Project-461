// eslint.config.js
import { ESLint } from "eslint";
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    // parser: "@typescript-eslint/parser",
    // parserOptions: {
    //   ecmaVersion: 2021, // Allow modern ECMAScript features
    //   sourceType: "module", // Allow the use of ES modules
    // },
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
      'no-console': 'off',
    },
  },
];
