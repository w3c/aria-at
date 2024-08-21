import globals from 'globals';

import eslintJs from '@eslint/js';

import eslintN from 'eslint-plugin-n';
import eslintPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: [
      'tests/**/reference/**/*',
      'build/tests/**/*',
      // keys are manually parsed in process-test-directory.js and depend on format
      'tests/resources/keys.mjs',

      // Automated tests related resources
      '__test__/__mocks__/tests/**/reference/**/*',
      '__test__/build/tests/**/*',
    ],
  },
  eslintJs.configs.recommended,
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
  // https://github.com/prettier/eslint-plugin-prettier?tab=readme-ov-file#configuration-new-eslintconfigjs
  eslintPrettierRecommended,
];
