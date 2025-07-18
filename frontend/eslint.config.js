import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'

export default [
  {
    // 忽略构建产物和依赖目录
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      '.git/**/*',
      'coverage/**/*',
      '*.d.ts'
    ],
  },
  {
    // 针对 JavaScript 配置文件
    files: ['*.js', '*.mjs', '*.cjs'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
    },
  },
  {
    // 针对配置文件，不使用 TypeScript 项目检查
    files: ['vite.config.ts', 'tailwind.config.js', 'postcss.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // 不设置 project，避免 TypeScript 项目检查
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // 针对 src 目录下的 TypeScript 和 React 文件
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // 基础 JavaScript 规则
      ...js.configs.recommended.rules,
      
      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'off', // 开发阶段允许 any
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // React Hooks 规则
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off', // 关闭依赖检查，开发阶段很烦人
      
      // React Refresh 规则
      'react-refresh/only-export-components': 'off', // 关闭组件导出限制
      
      // 代码质量规则 - 放宽一些规则以适应开发环境
      'no-console': 'off', // 开发阶段允许 console
      'no-debugger': 'warn',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-extra-semi': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': 'off', // 关闭 JS 版本，使用 TS 版本
      
      // 代码风格规则
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-template': 'off', // 关闭模板字符串强制要求
    },
  },
]