module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/', 'http://localhost:4173/productos', 'http://localhost:4173/carrito'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:4173',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // Best Practices
        'uses-https': 'off', // Disabled for local testing
        'is-on-https': 'off', // Disabled for local testing
        'uses-http2': 'off',   // Disabled for local testing
        'no-vulnerable-libraries': 'error',
        'charset': 'error',
        'doctype': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9009,
      storage: '.lighthouseci'
    }
  }
};