import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'public/**',
      '*.config.js',
      '*.config.ts',
      'next-env.d.ts'
    ]
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        React: 'readonly'
      }
    },
    rules: {
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-console': ['warn', { 'allow': ['warn', 'error'] }],
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        React: 'readonly'
      }
    },
    rules: {
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-console': ['warn', { 'allow': ['warn', 'error'] }],
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];