#!/usr/bin/env node
/**
 * Single Test Runner with Auto-Report
 *
 * Runs a single test and automatically generates a report.
 *
 * Usage:
 *   npm run test examples/02-simple-search.ts
 *   npm run test examples/12-price-comparison.ts
 */

import { TestWrapper } from './src/test-wrapper.js';
import { globalResourceManager } from './src/resource-manager.js';
import { basename } from 'path';
// Initialize token tracker (captures Stagehand usage logs)
import './src/token-tracker.js';

const testFile = process.argv[2];

if (!testFile) {
  console.error('❌ Error: Please provide a test file');
  console.error('\nUsage:');
  console.error('  npm run test examples/02-simple-search.ts');
  console.error('  npm run test examples/12-price-comparison.ts');
  process.exit(1);
}

async function runSingleTest() {
  const testName = basename(testFile, '.ts');
  const wrapper = new TestWrapper(`Single Test: ${testName}`);

  wrapper.startTest(testName);

  try {
    console.log(`\n🚀 Running: ${testFile}\n`);

    // Import and execute the test
    // Normalize path for dynamic import (works on Windows and Unix)
    const { pathToFileURL } = await import('url');
    const { resolve } = await import('path');
    const resolvedPath = testFile.startsWith('file://') ? testFile : pathToFileURL(resolve(testFile)).href;
    console.log(`Importing test module from: ${resolvedPath}`);
    const testModule = await import(resolvedPath);

    const stepStart = Date.now();

    console.log(`type of testModule.default: ${typeof testModule.default}`);
    console.log(`type of testModule.main: ${typeof testModule.main}`);
    
    // Run the test
    if (typeof testModule.default === 'function') {
      await testModule.default();
      console.log(`✅ Test ${testName} completed successfully. (default export)`);
    } 
    else if (typeof testModule.main === 'function') {
      await testModule.main();
      console.log(`✅ Test ${testName} completed successfully. (main export)`);
    }
    else {
      console.log(`✅ Test ${testName} Non as any of the previous options...`);
    }

    const stepDuration = Date.now() - stepStart;

    wrapper.logStep(
      'Execute Test',
      `Ran ${testFile}`,
      'success'
    ).duration = stepDuration;

    wrapper.endTest('passed', {
      file: testFile,
      duration: stepDuration
    });

  } catch (error: any) {
    wrapper.logStep(
      'Test Failed',
      error.message,
      'failure',
      { error: error.stack }
    );

    wrapper.endTest('failed', {
      file: testFile,
      error: error.message
    });
  } finally {
    // Ensure all resources (browsers, pages) are cleaned up before generating the report
    try {
      await globalResourceManager.cleanupAll();
      console.log('✅ Global resources cleaned up before report generation');
    } catch (err: any) {
      console.warn('⚠️  Error during global cleanup before report generation:', err?.message || err);
    }

    // Generate report AFTER test and cleanup are complete
    wrapper.generateReport(`test-${testName}`);
  }
}

runSingleTest().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
