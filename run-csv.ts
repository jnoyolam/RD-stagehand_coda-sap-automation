#!/usr/bin/env node
/**
 * CSV Test Suite CLI Runner
 *
 * Usage:
 *   npm run csv test-suites/sap-suite.csv
 *   npm run csv test-suites/sap-suite.csv --name "My Suite"
 *   npm run csv test-suites/sap-suite.csv --concurrent 4
 *
 * CSV Format:
 *   name,file,enabled,timeout
 *   "Test 1","examples/test1.ts",true,30000
 *   "Test 2","examples/test2.ts",true,
 */

import { parseCSV, validateTestPaths } from './src/csv-parser.js';
import { runTestSuite } from './src/test-suite-runner.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Please provide a CSV file');
    console.error('\nUsage:');
    console.error('  npm run csv test-suites/my-tests.csv');
    console.error('  npm run csv test-suites/my-tests.csv --name "Suite Name"');
    console.error('  npm run csv test-suites/my-tests.csv --concurrent 4');
    console.error('  npm run csv test-suites/my-tests.csv --sequential');
    console.error('\nCSV Format (comma-separated):');
    console.error('  name,file,enabled,timeout');
    console.error('  "Test 1","examples/test1.ts",true,30000');
    console.error('  "Test 2","examples/test2.ts",true,');
    process.exit(1);
  }

  const csvPath = args[0];
  
  // Parse optional arguments
  let suiteName: string | undefined;
  let maxConcurrency: number | undefined;
  let sequential = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      suiteName = args[i + 1];
      i++;
    } else if (args[i] === '--concurrent' && args[i + 1]) {
      maxConcurrency = parseInt(args[i + 1], 10);
      if (isNaN(maxConcurrency)) {
        console.error('❌ Error: --concurrent value must be a number');
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--sequential') {
      sequential = true;
    }
  }

  try {
    console.log('\n📖 Parsing CSV file:', csvPath);
    const config = parseCSV(csvPath, suiteName);

    // Validate test paths exist
    const errors = validateTestPaths(config);
    if (errors.length > 0) {
      console.error('\n❌ Validation errors:');
      errors.forEach(err => console.error('  -', err));
      process.exit(1);
    }

    console.log(`✅ Loaded ${config.tests.length} test(s) from CSV\n`);

    // Run the test suite (CSV defaults to sequential to avoid wrapper state conflicts)
    await runTestSuite(config, maxConcurrency, sequential || true);
  } catch (error: any) {
    console.error('\n❌ CSV parsing failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
