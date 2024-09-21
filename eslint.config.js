// eslint.config.js
import { ESLint } from 'eslint';

const eslintConfig = {
  parser: '@typescript-eslint/parser', // Specify the ESLint parser for TypeScript
  parserOptions: {
    ecmaVersion: 2021, // Allow modern ECMAScript features
    sourceType: 'module', // Allow the use of ES modules
  },
  extends: [
    'eslint:recommended', // Use recommended rules from ESLint
    'plugin:@typescript-eslint/recommended', // Use recommended rules from @typescript-eslint
  ],
  rules: {
    // Customize your rules here
    '@typescript-eslint/no-unused-vars': 'warn', // Example rule
    'no-console': 'off', // Example: allow console statements
    // Add other custom rules as needed
  },
  env: {
    browser: true, // Enable browser globals
    node: true, // Enable Node.js globals
    es2021: true, // Enable ES2021 globals
  },
};

export default eslintConfig; // Export the configuration as default
