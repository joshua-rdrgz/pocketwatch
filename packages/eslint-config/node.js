import { config as baseConfig } from './base.js';

/**
 * A shared ESLint configuration for NodeJS (just exports the base config).
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nodeJsConfig = [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
