/**
 * Stryker Configuration for React Components
 * Focused mutation testing for UI components
 */

import { defineConfig } from '@stryker-mutator/core'

export default defineConfig({
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  
  // Coverage analysis
  coverageAnalysis: 'perTest',
  
  // Focus only on React components
  mutate: [
    'src/components/**/*.tsx',
    'src/components/**/*.ts',
    '!src/components/**/*.test.*',
    '!src/components/**/*.spec.*',
    '!src/components/**/*.stories.*'
  ],
  
  // TypeScript checking
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  
  // Lower thresholds for component testing
  thresholds: {
    high: 75,
    low: 55,
    break: 40
  },
  
  // Faster execution for components
  timeoutMS: 30000,
  timeoutFactor: 1.2,
  concurrency: 4,
  
  // Component-specific mutations
  mutator: {
    excludedMutations: [
      'StringLiteral', // Less relevant for React components
      'BooleanLiteral' // Often used for conditional rendering
    ]
  },
  
  htmlReporter: {
    baseDir: 'reports/mutation/components',
    fileName: 'components-mutation-report.html'
  },
  
  tempDirName: '.stryker-tmp/components',
  cleanTempDir: true,
  logLevel: 'info'
});