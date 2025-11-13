import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

import eslintJs from '@eslint/js';

import eslintN from 'eslint-plugin-n';
import eslintPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  globalIgnores([
    'node_modules/**/*',
    'tests/**/reference/**/*',
    'build/tests/**/*',
    'build/resources/**/*',
    // keys are manually parsed in process-test-directory.js and depend on format
    'resources/keys.mjs',

    // Automated tests related resources
    '__test__/__mocks__/tests/**/reference/**/*',
    '__test__/build/tests/**/*',
  ]),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },

      ecmaVersion: 2021,
      sourceType: 'module',
    },

    extends: [
      eslintJs.configs.recommended,
      eslintN.configs['flat/recommended'],
      eslintPrettierRecommended,
    ],

    plugins: {
      eslintN,
    },

    rules: {
      'no-dupe-keys': 0,
      'no-undef': 0,
      'no-unused-vars': 0,
      'n/no-process-exit': 0,
    },
  },
]);
