import path from 'path';
import { fileURLToPath } from 'url';
import globals from 'globals';

import eslintJs from '@eslint/js';
// import { fixupPluginRules } from '@eslint/compat';
// import { FlatCompat } from '@eslint/eslintrc';

import eslintN from 'eslint-plugin-n';
import eslintPrettierRecommended from 'eslint-plugin-prettier/recommended';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: eslintJs.configs.recommended
// });

// /**
//  * @param {string} name
//  * @param {string} alias
//  * @returns {import("eslint").ESLint.Plugin}
//  */
// function legacyPlugin(name, alias = name) {
//   const plugin = compat.plugins(name)[0]?.plugins?.[alias];
//
//   if (!plugin) {
//     throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
//   }
//
//   return fixupPluginRules(plugin);
// }

export default [
  {
    ignores: [
      'tests/**/reference/**/*',
      'build/tests/**/*',
      // keys are manually parsed in process-test-directory.js and depend on format
      'tests/resources/keys.mjs',
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
      // import: legacyPlugin("eslint-plugin-import", "import"),
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
