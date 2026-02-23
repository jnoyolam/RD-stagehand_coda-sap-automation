/**
 * Test Suite Runner
 *
 * Executes test suites defined in YAML files with parallel execution support.
 * Automatically generates reports for all tests.
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { TestWrapper } from './test-wrapper.js';
import { config } from './config.js';
import { globalResourceManager } from './resource-manager.js';
import pLimit from 'p-limit';

// Initialize token tracker before running any tests
import './token-tracker.js';

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

export class TestSuiteRunner {
  private config: TestSuiteConfig;
  private wrapper: TestWrapper;
  private maxConcurrency: number;
  private sequential: boolean;

  constructor(configPathOrConfig: string | TestSuiteConfig, maxConcurrency?: number, sequential: boolean = false) {
    // Support both file paths and config objects
    if (typeof configPathOrConfig === 'string') {
      const yamlContent = readFileSync(configPathOrConfig, 'utf-8');
      this.config = parse(yamlContent) as TestSuiteConfig;
    } else {
      this.config = configPathOrConfig as TestSuiteConfig;
    }

    this.wrapper = new TestWrapper(this.config.name);

    // Use sequential mode (concurrency=1) if requested, otherwise use provided concurrency or config default
    this.maxConcurrency = sequential ? 1 : (maxConcurrency ?? config.testSuite.maxConcurrency);
    this.sequential = sequential;
  }

  async run() {
    console.log('\n' + '═'.repeat(70));
    console.log(`🚀 Running Test Suite: ${this.config.name}`);
    if (this.config.description) {
      console.log(`📝 ${this.config.description}`);
    }
    const executionMode = this.sequential ? 'Sequential' : `${this.maxConcurrency} in parallel`;
    console.log(`⚡ Execution Mode: ${executionMode}`);
    console.log('═'.repeat(70));

    const enabledTests = this.config.tests.filter(t => t.enabled !== false);
    console.log(`\n📋 Total tests: ${enabledTests.length}\n`);

    // Execute tests sequentially or with concurrency limit
    const results: PromiseSettledResult<void>[] = [];
    
    if (this.sequential) {
      // Run tests sequentially one after another
      for (let i = 0; i < enabledTests.length; i++) {
        try {
          await this.runSingleTest(enabledTests[i], i + 1, enabledTests.length);
          results.push({ status: 'fulfilled', value: undefined });
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
        }
      }
    } else {
      // Run tests with concurrency limit
      const limit = pLimit(this.maxConcurrency);
      const testPromises = enabledTests.map((test, index) =>
        limit(() => this.runSingleTest(test, index + 1, enabledTests.length))
      );
      const parallelResults = await Promise.allSettled(testPromises);
      results.push(...parallelResults);
    }

    // Log any rejected promises (shouldn't happen as errors are caught in runSingleTest)
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`\n⚠️  ${failures.length} test(s) had unexpected errors`);
    }

    // Ensure all resources are cleaned up before generating the final report
    try {
      await globalResourceManager.cleanupAll();
      console.log('✅ Global resources cleaned up before suite report generation');
    } catch (err: any) {
      console.warn('⚠️  Error during global cleanup before suite report generation:', err?.message || err);
    }

    // Generate final report
    const reportFile = this.config.reportFilename || `suite-${Date.now()}.html`;
    this.wrapper.generateReport(reportFile);
  }

  private async runSingleTest(
    test: TestSuiteConfig['tests'][0],
    index: number,
    total: number
  ): Promise<void> {
    console.log(`\n[${index}/${total}] 🧪 ${test.name} (Starting...)`);

    this.wrapper.startTest(test.name);
    const startTime = Date.now();

    try {
      // Get timeout from test config or use default
      const timeout = test.timeout ?? config.testSuite.defaultTimeout;

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
      );

      // Import and run the test file
      const testPromise = import(`../${test.file}`).then(async (testModule) => {
        // If the module exports a main function, run it
        if (typeof testModule.default === 'function') {
          await this.wrapper.timeStep(
            'Execute Test',
            `Running ${test.file}`,
            async () => await testModule.default()
          );
        } else if (typeof testModule.main === 'function') {
          await this.wrapper.timeStep(
            'Execute Test',
            `Running ${test.file}`,
            async () => await testModule.main()
          );
        } else {
          // If no main function, the module should have run on import
          this.wrapper.logStep(
            'Execute Test',
            `Loaded and executed ${test.file}`,
            'success'
          );
        }
      });

      // Race between test execution and timeout
      await Promise.race([testPromise, timeoutPromise]);

      console.log(`[${index}/${total}] ✅ ${test.name} (Passed)`);

      this.wrapper.endTest('passed', {
        file: test.file,
        duration: Date.now() - startTime
      });

    } catch (error: any) {
      console.error(`[${index}/${total}] ❌ ${test.name} (Failed): ${error.message}`);

      this.wrapper.logStep(
        'Test Failed',
        error.message,
        'failure',
        { error: error.stack }
      );

      this.wrapper.endTest('failed', {
        file: test.file,
        error: error.message
      });
    }
  }
}

/**
 * CLI entry point
 */
export async function runTestSuite(configPathOrConfig: string | TestSuiteConfig, maxConcurrency?: number, sequential: boolean = false) {
  try {
    const runner = new TestSuiteRunner(configPathOrConfig, maxConcurrency, sequential);
    await runner.run();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}
