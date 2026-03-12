/**
 * Test Wrapper with Auto-Reporting
 *
 * Wraps any test execution and automatically generates reports.
 * Works for both individual tests and test suites.
 */

import { ReportGenerator, TestResult, TestStep } from './report-generator.js';
import { globalResourceManager } from './resource-manager.js';
import { getTokenTrackerDiagnostics } from './token-tracker.js';

export class TestWrapper {
  private report: ReportGenerator;
  private currentTest: {
    name: string;
    startTime: number;
    steps: TestStep[];
  } | null = null;

  constructor(title: string = 'Test Execution Report') {
    this.report = new ReportGenerator(title, 'Automated Test Results');
  }

  /**
   * Start tracking a test
   */
  startTest(testName: string) {
    this.currentTest = {
      name: testName,
      startTime: Date.now(),
      steps: []
    };
    console.log(`\n🧪 Starting Test: ${testName}`);
  }

  /**
   * Log a step in the current test
   */
  logStep(name: string, description: string, status: 'success' | 'failure' | 'warning' = 'success', details?: any) {
    if (!this.currentTest) {
      throw new Error('No active test. Call startTest() first.');
    }

    const step: TestStep = {
      name,
      description,
      status,
      duration: 0, // Will be set by the caller if needed
      timestamp: new Date().toISOString(),
      details
    };

    this.currentTest.steps.push(step);

    const icon = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⚠️';
    console.log(`  ${icon} ${name}: ${description}`);

    return step; // Return so caller can update duration
  }

  /**
   * Attach a screenshot filename to the most recent step.
   * The filename should be relative to the report directory.
   */
  attachScreenshot(screenshotFilename: string) {
    if (!this.currentTest || this.currentTest.steps.length === 0) {
      console.warn('No step to attach screenshot to');
      return;
    }
    const lastStep = this.currentTest.steps[this.currentTest.steps.length - 1];
    lastStep.screenshot = screenshotFilename;
  }

  /**
   * End current test and add to report
   */
  endTest(status: 'passed' | 'failed' | 'warning' = 'passed', metadata?: any) {
    if (!this.currentTest) {
      throw new Error('No active test to end.');
    }

    const duration = Date.now() - this.currentTest.startTime;
    const endTime = new Date().toISOString();

    const result: TestResult = {
      testName: this.currentTest.name,
      status,
      duration,
      steps: this.currentTest.steps,
      startTime: new Date(this.currentTest.startTime).toISOString(),
      endTime,
      metadata
    };

    this.report.addTest(result);

    console.log(`  ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`  📊 Status: ${status.toUpperCase()}\n`);

    this.currentTest = null;
  }

  /**
   * Generate and save the report
   */
  generateReport(filename?: string, reportDir?: string): string {
    const reportFile = filename || `report-${Date.now()}.html`;

    // Set token usage before generating report
    const totalTokens = globalResourceManager.getTotalTokens();
    this.report.setTotalTokens(totalTokens);

    // Log diagnostics
    const diagnostics = getTokenTrackerDiagnostics();
    console.log('\n[TOKEN-TRACKER DIAGNOSTICS]');
    console.log('  Stdout write calls:', diagnostics.stdoutWriteCalls);
    console.log('  Usage lines found:', diagnostics.usageLinesFound);
    console.log('  Total tokens collected:', diagnostics.totalTokensCollected);

    const reportPath = this.report.saveReport(reportFile, reportDir);

    const summary = this.report['data'].summary;
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Tests:    ${summary.totalTests}`);
    console.log(`✅ Passed:      ${summary.passed}`);
    console.log(`❌ Failed:      ${summary.failed}`);
    console.log(`⚠️  Warnings:    ${summary.warnings}`);
    console.log(`⏱️  Total Time:  ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 Average:     ${(summary.averageDuration / 1000).toFixed(2)}s`);
    console.log(`🎫 Total Tokens: ${totalTokens.toLocaleString()}`);
    console.log('═'.repeat(60));
    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log(`🌐 Open in browser: file://${process.cwd()}/${reportPath}\n`);

    return reportPath;
  }

  /**
   * Helper to time a step
   */
  async timeStep<T>(
    name: string,
    description: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let status: 'success' | 'failure' | 'warning' = 'success';
    let result: T;
    let details: any;

    try {
      result = await fn();
      details = typeof result === 'object' ? result : undefined;
    } catch (error: any) {
      status = 'failure';
      details = { error: error.message };
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      const step = this.logStep(name, description, status, details);
      step.duration = duration;
    }

    return result!;
  }
}

/**
 * Global test wrapper instance for easy access
 */
let globalWrapper: TestWrapper | null = null;

export function getTestWrapper(title?: string): TestWrapper {
  if (!globalWrapper && title) {
    globalWrapper = new TestWrapper(title);
  }
  return globalWrapper!;
}

export function resetTestWrapper() {
  globalWrapper = null;
}
