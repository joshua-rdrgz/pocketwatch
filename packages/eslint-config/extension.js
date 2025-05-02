import { config as baseConfig } from './base.js';

/**
 * A shared ESLint configuration for the Chrom Extension (just exports the base config).
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const extensionConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
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
