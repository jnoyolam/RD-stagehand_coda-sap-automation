/**
 * CSV Test Suite Parser
 *
 * Converts CSV files into TestSuiteConfig for execution.
 * CSV format: name, file, enabled, timeout
 */

import { readFileSync, existsSync } from 'fs';
import { extname } from 'path';

export interface TestSuiteConfig {
  name: string;
  description?: string;
  tests: Array<{
    name: string;
    file: string;
    enabled?: boolean;
    timeout?: number;
  }>;
  reportFilename?: string;
}

/**
 * Parse CSV file and generate TestSuiteConfig
 * 
 * CSV Format:
 * name,file,enabled,timeout
 * "Test 1","examples/test1.ts",true,30000
 * "Test 2","examples/test2.ts",true,
 * "Test 3","examples/test3.ts",false,
 */
export function parseCSV(csvPath: string, suiteName?: string): TestSuiteConfig {
  const csvContent = readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one test row');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = ['name', 'file', 'enabled', 'timeout'];

  // Validate headers (at minimum, need 'name' and 'file')
  if (!headers.includes('name') || !headers.includes('file')) {
    throw new Error('CSV must have "name" and "file" columns. Headers found: ' + headers.join(', '));
  }

  // Parse test rows
  const tests: TestSuiteConfig['tests'] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    if (values.length < 2) continue; // Skip malformed lines

    const testName = values[headers.indexOf('name')] || `Test ${i}`;
    const testFile = values[headers.indexOf('file')];

    if (!testFile) {
      console.warn(`⚠️  Skipping row ${i}: missing file path`);
      continue;
    }

    const enabledStr = values[headers.indexOf('enabled')];
    const enabled = enabledStr === '' || enabledStr.toLowerCase() === 'true' ? true : enabledStr.toLowerCase() === 'false' ? false : true;

    const timeoutStr = values[headers.indexOf('timeout')] || '';
    const timeout = timeoutStr ? parseInt(timeoutStr, 10) : undefined;

    tests.push({
      name: testName,
      file: testFile,
      enabled,
      timeout
    });
  }

  if (tests.length === 0) {
    throw new Error('No valid test rows found in CSV');
  }

  return {
    name: suiteName || `Test Suite from ${extname(csvPath) === '.csv' ? csvPath.split('/').pop() : 'CSV'}`,
    description: `Generated from CSV: ${csvPath}`,
    tests,
    reportFilename: undefined
  };
}

/**
 * Parse a CSV line handling quoted values with commas
 * Examples:
 * - "Test 1","path/to/test.ts",true,30000
 * - Test 1,path/to/test.ts,true,30000
 * - "Test, with comma","path/to/test.ts",false,
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Validate that test files exist (optional)
 */
export function validateTestPaths(config: TestSuiteConfig, basePath: string = './'): string[] {
  const errors: string[] = [];

  for (const test of config.tests) {
    const fullPath = `${basePath}/${test.file}`;
    if (!existsSync(fullPath)) {
      errors.push(`Test file not found: ${fullPath}`);
    }
  }

  return errors;
}
