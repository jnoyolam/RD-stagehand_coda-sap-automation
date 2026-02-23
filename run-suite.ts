#!/usr/bin/env node
/**
 * Test Suite CLI Runner
 *
 * Usage:
 *   npm run suite test-suites/basic-suite.yaml
 *   npm run suite test-suites/advanced-suite.yaml
 *   npm run suite test-suites/full-suite.yaml
 */

import { runTestSuite } from './src/test-suite-runner.js';

const configPath = process.argv[2];

if (!configPath) {
  console.error('❌ Error: Please provide a test suite YAML file');
  console.error('\nUsage:');
  console.error('  npm run suite test-suites/basic-suite.yaml');
  console.error('  npm run suite test-suites/advanced-suite.yaml');
  console.error('  npm run suite test-suites/full-suite.yaml');
  process.exit(1);
}

runTestSuite(configPath);
