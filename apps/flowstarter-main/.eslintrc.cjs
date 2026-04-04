var tsConfigs = ['./tsconfig.json'];
var tsconfigRootDir = __dirname;

var ruleOverrides = {};

module.exports = {
  extends: ['plugin:@next/next/recommended'],
  overrides: [
    {
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@next/next/recommended',
        'prettier',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: tsConfigs,
        tsconfigRootDir,
      },
      plugins: ['@typescript-eslint', 'react-hooks', 'prettier'],
      rules: {
        'prettier/prettier': 1,
        '@typescript-eslint/no-unused-vars': [1, { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/no-unsafe-declaration-merging': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
      files: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    {
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:playwright/playwright-test',
        'prettier',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: tsConfigs,
        tsconfigRootDir,
      },
      plugins: [
        '@typescript-eslint',
        'playwright',
        'prettier',
      ],
      rules: {
        'prettier/prettier': 'error',
      },
      files: ['e2e/**/*.spec.ts'],
    },
    {
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@next/next/recommended',
        'prettier',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: tsConfigs,
        tsconfigRootDir,
      },
      plugins: ['@typescript-eslint', 'prettier'],
      rules: {
        'prettier/prettier': 1,
        '@typescript-eslint/no-unused-vars': [1, { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'react-hooks/rules-of-hooks': 'off',
        'react-hooks/exhaustive-deps': 'off',
      },
      files: [
        'src/app/api/**/*.ts',
        'src/data/**/*.ts',
        'src/hooks/useServerSupabase.ts',
        'src/lib/google-oauth-helper.ts',
      ],
    },
  ],
  root: true,
  ignorePatterns: [
    '*.js', '*.mjs', '*.cjs', '*.json',
    'src/lib/database.types.ts',
    'src/app/api/example-sites/**',
    'src/app/api/dashboard/stats/**',
    'src/app/api/projects/[id]/analytics/**',
  ],
};
