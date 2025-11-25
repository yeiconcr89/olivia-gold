/**
 * Lighthouse Performance Testing
 * Tests Core Web Vitals and performance metrics
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Performance thresholds
const THRESHOLDS = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 85,
  pwa: 80,
  // Core Web Vitals
  'largest-contentful-paint': 2500,
  'first-input-delay': 100,
  'cumulative-layout-shift': 0.1,
  'first-contentful-paint': 1800,
  'speed-index': 3000,
  'interactive': 3800,
  'total-blocking-time': 200
};

// URLs to test
const URLS_TO_TEST = [
  {
    url: 'http://localhost:5173/',
    name: 'Homepage'
  },
  {
    url: 'http://localhost:5173/productos',
    name: 'Products Page'
  },
  {
    url: 'http://localhost:5173/producto/test-product',
    name: 'Product Detail Page'
  },
  {
    url: 'http://localhost:5173/carrito',
    name: 'Cart Page'
  }
];

// Lighthouse configuration
const CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    emulatedFormFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    auditMode: false,
    gatherMode: false
  }
};

/**
 * Run Lighthouse audit for a single URL
 */
async function runLighthouseAudit(url, name) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  try {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };
    
    console.log(`🔍 Running Lighthouse audit for: ${name}`);
    const runnerResult = await lighthouse(url, options, CONFIG);
    
    if (!runnerResult) {
      throw new Error(`Failed to run Lighthouse for ${url}`);
    }
    
    return {
      name,
      url,
      report: runnerResult.report,
      lhr: runnerResult.lhr
    };
  } finally {
    await chrome.kill();
  }
}

/**
 * Analyze results and check against thresholds
 */
function analyzeResults(results) {
  console.log('\n📊 LIGHTHOUSE PERFORMANCE RESULTS');
  console.log('=====================================');
  
  const allPassed = [];
  
  results.forEach(result => {
    console.log(`\n🔍 ${result.name} (${result.url})`);
    console.log('-'.repeat(50));
    
    const { categories, audits } = result.lhr;
    
    // Category scores
    Object.entries(categories).forEach(([key, category]) => {
      const score = Math.round(category.score * 100);
      const threshold = THRESHOLDS[key];
      const passed = score >= threshold;
      const status = passed ? '✅' : '❌';
      
      console.log(`${status} ${category.title}: ${score}% (threshold: ${threshold}%)`);
      allPassed.push(passed);
    });
    
    // Core Web Vitals
    console.log('\n📈 Core Web Vitals:');
    const coreWebVitals = [
      'largest-contentful-paint',
      'first-input-delay', 
      'cumulative-layout-shift',
      'first-contentful-paint'
    ];
    
    coreWebVitals.forEach(auditId => {
      if (audits[auditId]) {
        const audit = audits[auditId];
        const value = audit.numericValue;
        const threshold = THRESHOLDS[auditId];
        const passed = value <= threshold;
        const status = passed ? '✅' : '❌';
        
        console.log(`${status} ${audit.title}: ${Math.round(value)}ms (threshold: ${threshold}ms)`);
        allPassed.push(passed);
      }
    });
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'reports', `${result.name.replace(/\s+/g, '-').toLowerCase()}-report.json`);
    fs.writeFileSync(reportPath, result.report);
    console.log(`📄 Detailed report saved: ${reportPath}`);
  });
  
  // Overall results
  const passedCount = allPassed.filter(Boolean).length;
  const totalCount = allPassed.length;
  const overallScore = (passedCount / totalCount) * 100;
  
  console.log('\n🎯 OVERALL PERFORMANCE SCORE');
  console.log('=====================================');
  console.log(`${overallScore >= 80 ? '✅' : '❌'} ${passedCount}/${totalCount} checks passed (${overallScore.toFixed(1)}%)`);
  
  if (overallScore < 80) {
    console.log('\n❌ Performance thresholds not met!');
    process.exit(1);
  } else {
    console.log('\n✅ All performance thresholds met!');
  }
  
  return {
    overallScore,
    passedCount,
    totalCount,
    results
  };
}

/**
 * Generate HTML report
 */
function generateHTMLReport(analysisResults) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Olivia Gold - Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .passed { border-left-color: #4CAF50; background: #f8fff8; }
        .failed { border-left-color: #f44336; background: #fff8f8; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Olivia Gold Performance Report</h1>
        <p>Generated on ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Overall Score:</strong> ${analysisResults.overallScore.toFixed(1)}%</p>
        <p><strong>Tests Passed:</strong> ${analysisResults.passedCount}/${analysisResults.totalCount}</p>
    </div>
    
    ${analysisResults.results.map(result => `
        <div class="page-results">
            <h3>📄 ${result.name}</h3>
            <p><strong>URL:</strong> ${result.url}</p>
            
            <h4>Category Scores</h4>
            ${Object.entries(result.lhr.categories).map(([key, category]) => {
              const score = Math.round(category.score * 100);
              const threshold = THRESHOLDS[key];
              const passed = score >= threshold;
              return `<div class="metric ${passed ? 'passed' : 'failed'}">
                ${passed ? '✅' : '❌'} ${category.title}: ${score}% (threshold: ${threshold}%)
              </div>`;
            }).join('')}
        </div>
    `).join('')}
    
</body>
</html>`;
  
  const reportPath = path.join(__dirname, 'reports', 'performance-summary.html');
  fs.writeFileSync(reportPath, html);
  console.log(`\n📊 HTML report generated: ${reportPath}`);
}

/**
 * Main execution function
 */
async function runPerformanceTests() {
  try {
    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    console.log('🚀 Starting Lighthouse Performance Testing...');
    console.log(`Testing ${URLS_TO_TEST.length} URLs`);
    
    // Run tests for all URLs
    const results = [];
    for (const { url, name } of URLS_TO_TEST) {
      const result = await runLighthouseAudit(url, name);
      results.push(result);
    }
    
    // Analyze and report results
    const analysisResults = analyzeResults(results);
    generateHTMLReport(analysisResults);
    
    console.log('\n🎉 Performance testing completed!');
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = {
  runPerformanceTests,
  THRESHOLDS,
  URLS_TO_TEST
};