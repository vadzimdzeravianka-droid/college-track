import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'node_modules/**',
      'coverage/**',
      '.claude/workflows/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'writable',
        JSX: 'writable',
        NodeJS: 'writable',
        console: 'readable',
        process: 'readable',
        __dirname: 'readable',
        __filename: 'readable',
        module: 'writable',
        require: 'readable',
        exports: 'writable',
        window: 'readable',
        document: 'readable',
        navigator: 'readable',
        fetch: 'readable',
        Request: 'readable',
        Response: 'readable',
        setTimeout: 'readable',
        setInterval: 'readable',
        clearTimeout: 'readable',
        clearInterval: 'readable',
        localStorage: 'readable',
        sessionStorage: 'readable',
        HTMLElement: 'readable',
        HTMLDivElement: 'readable',
        HTMLButtonElement: 'readable',
        HTMLInputElement: 'readable',
        HTMLTextAreaElement: 'readable',
        URL: 'readable',
        URLSearchParams: 'readable',
        // Jest globals
        describe: 'readable',
        it: 'readable',
        test: 'readable',
        expect: 'readable',
        beforeEach: 'readable',
        afterEach: 'readable',
        beforeAll: 'readable',
        afterAll: 'readable',
        jest: 'readable',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]
