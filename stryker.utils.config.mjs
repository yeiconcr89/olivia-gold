/**
 * Stryker Configuration for Utility Functions
 * High-precision mutation testing for business logic
 */

import { defineConfig } from '@stryker-mutator/core'

export default defineConfig({
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'vitest',
  
  // Coverage analysis
  coverageAnalysis: 'perTest',
  
  // Focus on utilities and services (business logic)
  mutate: [
    'src/utils/**/*.ts',
    'src/services/**/*.ts',
    'src/lib/**/*.ts',
    'src/hooks/**/*.ts',
    '!**/*.test.*',
    '!**/*.spec.*'
  ],
  
  // TypeScript checking
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  
  // Higher thresholds for business logic
  thresholds: {
    high: 90,
    low: 75,
    break: 65
  },
  
  // More comprehensive timeout for complex logic
  timeoutMS: 45000,
  timeoutFactor: 2.0,
  concurrency: 2, // Lower concurrency for thorough testing
  
  // Include more mutation types for business logic
  mutator: {
    excludedMutations: [
      // Keep most mutations for business logic testing
    ]
  },
  
  htmlReporter: {
    baseDir: 'reports/mutation/utils',
    fileName: 'utils-mutation-report.html'
  },
  
  jsonReporter: {
    fileName: 'reports/mutation/utils/utils-mutation-report.json'
  },
  
  tempDirName: '.stryker-tmp/utils',
  cleanTempDir: true,
  logLevel: 'info',
  
  // Enable incremental testing
  incremental: true,
  incrementalFile: '.stryker-tmp/utils/incremental.json'
});