//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      'src/api/generated/**',
      'dev-dist/**',
      // A separate npm project with its own config. Linting it from here would
      // apply this project's rules and resolver to code that isn't part of it.
      'marketing/**',
      'site/**',
    ],
  },
]
