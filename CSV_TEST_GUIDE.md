# CSV Test Runner - Complete Guide

## Overview

The CSV Test Runner allows you to execute test suites by providing a simple comma-separated values (CSV) file. This is ideal for:
- **Non-developers**: Run tests without understanding YAML syntax
- **Test managers**: Manage test lists in Excel or spreadsheet tools
- **CI/CD pipelines**: Programmatically generate test lists
- **Dynamic execution**: Generate CSV files from databases or APIs

## Quick Start

### Basic Usage

```bash
npm run csv test-suites/sap-fiori-suite.csv
```

### With Options

```bash
# Run with a custom suite name
npm run csv test-suites/my-tests.csv --name "My Test Suite"

# Run with custom concurrency (default is 2)
npm run csv test-suites/my-tests.csv --concurrent 4

# Combine options
npm run csv test-suites/my-tests.csv --name "Custom Suite" --concurrent 4
```

### Pre-configured Commands

```bash
# Fiori tests from CSV
npm run csv:fiori

# WebGUI tests from CSV
npm run csv:webgui
```

## CSV Format

### Required Columns
- **name**: Test name (required)
- **file**: Path to test file (required)
- **enabled**: true/false to enable/disable test (optional, defaults to true)
- **timeout**: Timeout in milliseconds (optional)

### Example CSV

```csv
name,file,enabled,timeout
"Fiori Login","examples/sap/01-fiori-login.ts",true,
"Fiori Navigate","examples/sap/02-fiori-navigate-tile.ts",true,30000
"WebGUI Login","examples/sap/06-webgui-login.ts",false,
"Critical Test","examples/sap/04-fiori-extract-table.ts",true,60000
```

### CSV Rules

1. **Headers are required** - First line must be: `name,file,enabled,timeout`
2. **Quoted values** - Wrap values with commas inside in quotes:
   ```csv
   "Test with, comma in name","path/to/test.ts",true,
   ```
3. **Spaces are trimmed** - Leading/trailing spaces are automatically removed
4. **Empty lines are skipped** - Blank rows don't cause errors
5. **Boolean values** - Use `true` or `false` (case-insensitive)
6. **Timeouts are numbers** - Milliseconds only, leave blank for default

## File Locations

Create your CSV files in the `test-suites/` directory:

```
test-suites/
  ├── sap-fiori-suite.csv
  ├── sap-webgui-suite.csv
  ├── sap-fiori-suite.yaml
  ├── sap-webgui-suite.yaml
  └── custom-tests.csv
```

## Features

### ✅ Complete Integration
- Uses existing TestSuiteRunner (all features included)
- Token tracking for LLM usage
- Parallel test execution
- Comprehensive HTML reports
- Diagnostics and logging

### ✅ Validation
- Checks that all test files exist
- Validates CSV format
- Provides helpful error messages

### ✅ Flexible Options
- Override suite name
- Control concurrency
- Mix enabled/disabled tests in one file

## Examples

### Example 1: Basic CSV

**File: `test-suites/basic.csv`**
```csv
name,file,enabled,timeout
"Login Test","examples/sap/01-fiori-login.ts",true,
"Navigation Test","examples/sap/02-fiori-navigate-tile.ts",true,
```

**Run:**
```bash
npm run csv test-suites/basic.csv
```

---

### Example 2: With Timeouts

**File: `test-suites/long-running.csv`**
```csv
name,file,enabled,timeout
"Quick Test","examples/sap/01-fiori-login.ts",true,30000
"Long Test","examples/sap/08-webgui-create-po.ts",true,120000
"Medium Test","examples/sap/04-fiori-extract-table.ts",true,60000
```

**Run:**
```bash
npm run csv test-suites/long-running.csv --concurrent 1
```

---

### Example 3: Selective Execution

**File: `test-suites/smoke-tests.csv`**
```csv
name,file,enabled,timeout
"Login","examples/sap/01-fiori-login.ts",true,
"Navigation","examples/sap/02-fiori-navigate-tile.ts",true,
"Extract Data","examples/sap/04-fiori-extract-table.ts",true,
"Deprecated Test","examples/sap/old-test.ts",false,
```

**Run:**
```bash
npm run csv test-suites/smoke-tests.csv
```
Only enabled tests will run (the last one is skipped).

---

## Programmatic Usage

You can also use the CSV parser directly in your code:

```typescript
import { parseCSV } from './src/csv-parser.js';
import { runTestSuite } from './src/test-suite-runner.js';

// Parse CSV
const config = parseCSV('test-suites/my-tests.csv', 'My Suite');

// Run tests
await runTestSuite(config, 4); // 4 concurrent tests
```

## Comparison: CSV vs YAML

### CSV Advantages
- ✅ Easier for non-technical users
- ✅ Works with Excel/Google Sheets
- ✅ Simpler format
- ✅ Less verbose

### YAML Advantages
- ✅ More features (suite description, etc.)
- ✅ Familiar to developers
- ✅ Complex metadata support

### Use Both!
You can use both CSV and YAML files. Mix and match based on your needs:

```bash
# Run tests from CSV
npm run csv test-suites/my-tests.csv

# Run tests from YAML
npm run suite test-suites/my-suite.yaml
```

## Error Handling

### Missing CSV File
```
❌ Error: Please provide a CSV file

Usage:
  npm run csv test-suites/my-tests.csv
```

### Invalid CSV Format
```
❌ CSV must have "name" and "file" columns. Headers found: name, test_file
```

### Missing Test File
```
❌ Validation errors:
  - Test file not found: examples/sap/01-fiori-login.ts
```

### Solution
- Verify file paths are relative to project root
- Ensure CSV has required columns: `name` and `file`
- Check file permissions

## Tips & Tricks

### 1. Generate CSV Dynamically
```bash
# Create CSV from database/API and run
echo "name,file,enabled,timeout" > tests.csv
curl https://api.example.com/tests >> tests.csv
npm run csv tests.csv
```

### 2. Run Subset of Tests
Disable tests in CSV instead of deleting them:
```csv
name,file,enabled,timeout
"Active Test 1","examples/sap/01.ts",true,
"Active Test 2","examples/sap/02.ts",true,
"Disabled Test","examples/sap/03.ts",false,
```

### 3. Monitor Execution
Tail the terminal output for real-time updates:
```bash
npm run csv test-suites/suite.csv | tee test-run.log
```

### 4. Create Template CSV
```bash
cat > test-suites/template.csv << 'EOF'
name,file,enabled,timeout
"Test Name","examples/sap/XX-test.ts",true,
EOF
```

## Architecture

The CSV test runner uses:

```
run-csv.ts (CLI Entry)
    ↓
src/csv-parser.ts (Parse CSV → Config)
    ↓
src/test-suite-runner.ts (Execute Tests)
    ↓
Reports + Token Tracking
```

### Key Components

- **run-csv.ts**: Command-line interface
- **csv-parser.ts**: CSV parsing and validation
- **test-suite-runner.ts**: Test execution (reused from YAML runner)

All existing features are automatically included:
- Token usage tracking
- Parallel execution
- HTML report generation
- Error handling and retry logic

## Troubleshooting

### Tests not running?
1. Check CSV file path is correct
2. Verify test files exist
3. Check console for validation errors

### Wrong test executing?
1. Verify CSV file content with `cat test-suites/your-file.csv`
2. Check file paths in CSV are correct
3. Run with verbose output

### Performance issues?
1. Adjust `--concurrent` flag
2. Add `timeout` values for long-running tests
3. Disable unnecessary tests with `enabled: false`

## Supported Commands

```bash
npm run csv <path>                              # Run CSV with defaults
npm run csv <path> --name "Suite Name"          # Custom suite name
npm run csv <path> --concurrent 4               # Control parallelization
npm run csv:fiori                               # Pre-configured Fiori tests
npm run csv:webgui                              # Pre-configured WebGUI tests
```

## Next Steps

1. **Create your first CSV**: `test-suites/my-tests.csv`
2. **Run it**: `npm run csv test-suites/my-tests.csv`
3. **Check the report**: Generated in `reports/` folder
4. **Monitor tokens**: Check "Total Tokens" in HTML report

That's it! You now have a powerful, flexible way to manage and execute test suites.
