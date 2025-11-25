/**
 * Stryker Mutation Testing Configuration
 * Tests the quality of our test suite by introducing mutations
 */

import { defineConfig } from '@stryker-mutator/core'

export default defineConfig({
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'vitest',
  
  // Coverage analysis to focus mutation testing
  coverageAnalysis: 'perTest',
  
  // Files to mutate
  mutate: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.spec.ts', 
    '!src/**/*.spec.tsx',
    '!src/setupTests.ts',
    '!src/tests/factories/**',
    '!src/vite-env.d.ts'
  ],
  
  // Test files
  testRunner_comment: 'Configuration for vitest test runner',
  vitest: {
    configFile: 'vitest.config.ts'
  },
  
  // TypeScript checking
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  
  // Mutation threshold - minimum mutation score required
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Timeout settings
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  
  // Concurrency - adjust based on system resources
  concurrency: 4,
  
  // Incremental mode - only test changed files in subsequent runs
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',
  
  // Ignore specific patterns or mutants
  ignorers: ['node_modules'],
  
  // Mutation configuration
  mutator: {
    plugins: ['typescript'],
    excludedMutations: [
      // Exclude less valuable mutations for faster execution
      'StringLiteral',
      'BooleanLiteral',
      'ArrayDeclaration'
    ]
  },
  
  // HTML Reporter configuration
  htmlReporter: {
    baseDir: 'reports/mutation',
    fileName: 'mutation-report.html'
  },
  
  // JSON Reporter configuration  
  jsonReporter: {
    fileName: 'reports/mutation/mutation-report.json'
  },
  
  // Temp directory for Stryker files
  tempDirName: '.stryker-tmp',
  
  // Clean temp directory after run
  cleanTempDir: true,
  
  // Log level
  logLevel: 'info',
  
  // File patterns to ignore completely
  ignore: [
    'dist/**',
    'coverage/**',
    'node_modules/**',
    '**/*.d.ts',
    'public/**',
    'build/**'
  ],
  
  // Plugins
  plugins: [
    '@stryker-mutator/vitest-runner',
    '@stryker-mutator/typescript-checker'
  ]
});