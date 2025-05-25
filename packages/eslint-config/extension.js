import { config as reactConfig } from './react-internal.js';

/**
 * A shared ESLint configuration for the Chrome Extension.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const extensionConfig = [
  ...reactConfig,
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
