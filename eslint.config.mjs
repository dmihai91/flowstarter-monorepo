import nxPlugin from '@nx/eslint-plugin';

/**
 * Root ESLint config — enforces Nx module boundary constraints.
 * Each project config should import this via:
 *   import baseConfig from '../../eslint.config.mjs';
 *   export default [...baseConfig, ...projectRules];
 */
export default [
  // Only apply to packages/ — apps use their own per-project ESLint configs
  { ignores: ['apps/**', 'node_modules/**', 'dist/**', '.nx/**'] },
  ...nxPlugin.configs['flat/base'],
  ...nxPlugin.configs['flat/typescript'],
  ...nxPlugin.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'warn',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'app:main',
              onlyDependOnLibsWithTags: ['pkg:shared'],
            },
            {
              sourceTag: 'app:editor',
              onlyDependOnLibsWithTags: ['pkg:shared'],
            },
            {
              sourceTag: 'app:code',
              onlyDependOnLibsWithTags: ['pkg:shared'],
            },
            {
              sourceTag: 'app:library',
              onlyDependOnLibsWithTags: ['pkg:shared'],
            },
            {
              sourceTag: 'pkg:shared',
              onlyDependOnLibsWithTags: ['pkg:shared'],
            },
          ],
        },
      ],
    },
  },
];
