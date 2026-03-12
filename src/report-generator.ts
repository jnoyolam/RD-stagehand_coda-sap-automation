/**
 * HTML Report Generator
 *
 * Generates elegant, interactive HTML reports with:
 * - Test execution timeline
 * - Performance metrics and charts
 * - Step-by-step results
 * - Screenshots (optional)
 * - Export to HTML
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';

export interface TestStep {
  name: string;
  description: string;
  status: 'success' | 'failure' | 'warning' | 'running';
  duration: number;
  timestamp: string;
  details?: any;
  error?: string;
  /** Filename of a screenshot captured during this step (relative to report dir) */
  screenshot?: string;
}

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  steps: TestStep[];
  startTime: string;
  endTime: string;
  metadata?: {
    url?: string;
    itemsProcessed?: number;
    dataExtracted?: any[];
    apiCalls?: number;
    tokensUsed?: number;
  };
}

export interface ReportData {
  title: string;
  subtitle: string;
  timestamp: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
    totalDuration: number;
    averageDuration: number;
    totalTokensUsed: number;
  };
  tests: TestResult[];
  config: {
    model: string;
    provider: string;
    endpoint: string;
  };
}

export class ReportGenerator {
  private data: ReportData;

  constructor(title: string = 'Stagehand Test Report', subtitle: string = 'Browser Automation Results') {
    this.data = {
      title,
      subtitle,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        totalDuration: 0,
        averageDuration: 0,
        totalTokensUsed: 0,
      },
      tests: [],
      config: {
        model: 'gpt-4o',
        provider: 'openai',
        endpoint: 'localhost:3456 → api.beta.saia.ai',
      },
    };
  }

  addTest(result: TestResult) {
    this.tests.push(result);
    this.updateSummary();
  }

  private updateSummary() {
    this.data.summary.totalTests = this.data.tests.length;
    this.data.summary.passed = this.data.tests.filter(t => t.status === 'passed').length;
    this.data.summary.failed = this.data.tests.filter(t => t.status === 'failed').length;
    this.data.summary.warnings = this.data.tests.filter(t => t.status === 'warning').length;
    this.data.summary.totalDuration = this.data.tests.reduce((sum, t) => sum + t.duration, 0);
    this.data.summary.averageDuration = this.data.summary.totalDuration / this.data.summary.totalTests;
  }

  setTotalTokens(tokens: number) {
    this.data.summary.totalTokensUsed = tokens;
  }

  generateHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.data.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      color: #333;
      padding: 2rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e0e0e0;
      overflow: hidden;
    }

    .header {
      background: #2c3e50;
      color: white;
      padding: 2rem;
      border-bottom: 3px solid #1a252f;
    }

    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .header p {
      font-size: 1rem;
      opacity: 0.85;
    }

    .timestamp {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      opacity: 0.7;
    }

    .content {
      padding: 2rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #fafafa;
      padding: 1.25rem;
      border: 1px solid #e0e0e0;
      text-align: center;
    }

    .stat-card.success {
      border-left: 4px solid #28a745;
    }

    .stat-card.failure {
      border-left: 4px solid #dc3545;
    }

    .stat-card.warning {
      border-left: 4px solid #ffc107;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .stat-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-container {
      background: #fafafa;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
    }

    .chart-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #2c3e50;
    }

    .test-results {
      margin-top: 2rem;
    }

    .test-card {
      background: white;
      border: 1px solid #e0e0e0;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .test-header {
      padding: 1.25rem;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .test-title {
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-badge {
      padding: 0.3rem 0.8rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      border: 1px solid;
    }

    .status-badge.passed {
      background: white;
      color: #28a745;
      border-color: #28a745;
    }

    .status-badge.failed {
      background: white;
      color: #dc3545;
      border-color: #dc3545;
    }

    .status-badge.warning {
      background: white;
      color: #ffc107;
      border-color: #ffc107;
    }

    .test-meta {
      display: flex;
      gap: 2rem;
      font-size: 0.85rem;
      color: #666;
    }

    .test-body {
      padding: 1.25rem;
      display: none;
      background: white;
    }

    .test-body.expanded {
      display: block;
    }

    .steps-timeline {
      position: relative;
      padding-left: 1.5rem;
    }

    .step {
      position: relative;
      padding: 1rem;
      margin-bottom: 0.75rem;
      background: #fafafa;
      border-left: 3px solid #e0e0e0;
    }

    .step.success {
      border-left-color: #28a745;
    }

    .step.failure {
      border-left-color: #dc3545;
    }

    .step.warning {
      border-left-color: #ffc107;
    }

    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .step-name {
      font-weight: 600;
      font-size: 1rem;
    }

    .step-duration {
      font-size: 0.8rem;
      color: #666;
      background: white;
      padding: 0.25rem 0.6rem;
      border: 1px solid #e0e0e0;
    }

    .step-description {
      color: #555;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .step-details {
      background: white;
      padding: 0.75rem;
      border: 1px solid #e0e0e0;
      margin-top: 0.5rem;
      font-size: 0.85rem;
      font-family: 'Courier New', monospace;
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #fafafa;
      border: 1px solid #e0e0e0;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
    }

    .metadata-label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 0.3rem;
    }

    .metadata-value {
      font-weight: 600;
      font-size: 1rem;
      color: #333;
    }

    .config-section {
      background: #fafafa;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      margin-top: 2rem;
    }

    .config-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #2c3e50;
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .footer {
      text-align: center;
      padding: 1.5rem;
      color: #666;
      border-top: 1px solid #e0e0e0;
      font-size: 0.85rem;
    }

    .step-screenshot img {
      transition: max-width 0.3s ease;
    }

    .step-screenshot img.expanded-img {
      max-width: 100vw !important;
      position: relative;
      z-index: 10;
    }

    @media print {
      body { background: white; padding: 0; }
      .container { border: none; }
      .test-body { display: block !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${this.data.title}</h1>
      <p>${this.data.subtitle}</p>
      <div class="timestamp">Generated: ${new Date(this.data.timestamp).toLocaleString()}</div>
    </div>

    <div class="content">
      <div class="summary-grid">
        <div class="stat-card">
          <div class="stat-value">${this.data.summary.totalTests}</div>
          <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">${this.data.summary.passed}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat-card failure">
          <div class="stat-value">${this.data.summary.failed}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">${this.data.summary.warnings}</div>
          <div class="stat-label">Warnings</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(this.data.summary.totalDuration / 1000).toFixed(1)}s</div>
          <div class="stat-label">Total Duration</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(this.data.summary.averageDuration / 1000).toFixed(1)}s</div>
          <div class="stat-label">Avg Duration</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.data.summary.totalTokensUsed.toLocaleString()}</div>
          <div class="stat-label">Total Tokens</div>
        </div>
      </div>

      <div class="charts-section">
        <div class="chart-container">
          <div class="chart-title">Test Results Distribution</div>
          <canvas id="resultsChart"></canvas>
        </div>
        <div class="chart-container">
          <div class="chart-title">Execution Timeline</div>
          <canvas id="timelineChart"></canvas>
        </div>
      </div>

      <div class="test-results">
        <h2 style="margin-bottom: 1.5rem; color: #2c3e50; font-size: 1.3rem; font-weight: 600;">Test Results</h2>
        ${this.data.tests.map((test, index) => this.generateTestCard(test, index)).join('')}
      </div>

      <div class="config-section">
        <div class="config-title">Configuration</div>
        <div class="config-grid">
          <div class="metadata-item">
            <div class="metadata-label">Model</div>
            <div class="metadata-value">${this.data.config.model}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Provider</div>
            <div class="metadata-value">${this.data.config.provider}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Endpoint</div>
            <div class="metadata-value">${this.data.config.endpoint}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Generated by Stagehand Browser Automation Framework</p>
      <p>Powered by CODA GEAI (gpt-4o)</p>
    </div>
  </div>

  <script>
    // Toggle test body
    document.querySelectorAll('.test-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        body.classList.toggle('expanded');
      });
    });

    // Results Chart
    const resultsCtx = document.getElementById('resultsChart').getContext('2d');
    new Chart(resultsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed', 'Warnings'],
        datasets: [{
          data: [${this.data.summary.passed}, ${this.data.summary.failed}, ${this.data.summary.warnings}],
          backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // Timeline Chart
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    new Chart(timelineCtx, {
      type: 'bar',
      data: {
        labels: [${this.data.tests.map((t, i) => `'Test ${i + 1}'`).join(', ')}],
        datasets: [{
          label: 'Duration (seconds)',
          data: [${this.data.tests.map(t => (t.duration / 1000).toFixed(2)).join(', ')}],
          backgroundColor: [${this.data.tests.map(t =>
            t.status === 'passed' ? "'rgba(40, 167, 69, 0.8)'" :
            t.status === 'failed' ? "'rgba(220, 53, 69, 0.8)'" :
            "'rgba(255, 193, 7, 0.8)'"
          ).join(', ')}],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  </script>
</body>
</html>`;
  }

  private generateTestCard(test: TestResult, index: number): string {
    return `
      <div class="test-card">
        <div class="test-header">
          <div class="test-title">
            <span>Test ${index + 1}: ${test.testName}</span>
            <span class="status-badge ${test.status}">${test.status}</span>
          </div>
          <div class="test-meta">
            <span>⏱️ ${(test.duration / 1000).toFixed(2)}s</span>
            <span>📊 ${test.steps.length} steps</span>
          </div>
        </div>
        <div class="test-body">
          <div class="steps-timeline">
            ${test.steps.map(step => this.generateStep(step)).join('')}
          </div>
          ${test.metadata ? this.generateMetadata(test.metadata) : ''}
        </div>
      </div>
    `;
  }

  private generateStep(step: TestStep): string {
    return `
      <div class="step ${step.status}">
        <div class="step-header">
          <div class="step-name">
            ${step.status === 'success' ? '✅' : step.status === 'failure' ? '❌' : '⚠️'}
            ${step.name}
          </div>
          <div class="step-duration">${step.duration}ms</div>
        </div>
        <div class="step-description">${step.description}</div>
        ${step.screenshot ? `
          <div class="step-screenshot" style="margin-top: 0.75rem;">
            <img src="${step.screenshot}" alt="Screenshot: ${step.name}" style="max-width: 100%; border: 1px solid #e0e0e0; cursor: pointer;" onclick="this.classList.toggle('expanded-img')" />
          </div>
        ` : ''}
        ${step.details ? `<div class="step-details">${JSON.stringify(step.details, null, 2)}</div>` : ''}
        ${step.error ? `<div class="step-details" style="color: #dc3545;">${step.error}</div>` : ''}
      </div>
    `;
  }

  private generateMetadata(metadata: any): string {
    return `
      <div class="metadata-grid">
        ${metadata.url ? `
          <div class="metadata-item">
            <div class="metadata-label">URL</div>
            <div class="metadata-value">${metadata.url}</div>
          </div>
        ` : ''}
        ${metadata.itemsProcessed ? `
          <div class="metadata-item">
            <div class="metadata-label">Items Processed</div>
            <div class="metadata-value">${metadata.itemsProcessed}</div>
          </div>
        ` : ''}
        ${metadata.apiCalls ? `
          <div class="metadata-item">
            <div class="metadata-label">API Calls</div>
            <div class="metadata-value">${metadata.apiCalls}</div>
          </div>
        ` : ''}
        ${metadata.tokensUsed ? `
          <div class="metadata-item">
            <div class="metadata-label">Tokens Used</div>
            <div class="metadata-value">${metadata.tokensUsed.toLocaleString()}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate a timestamp string (YYYYMMDD_HHmmss) for report directories.
   * Exposed as static so callers can pre-create the report directory
   * and save screenshots there before the report is finalized.
   */
  static buildTimestamp(date: Date = new Date()): string {
    return date.getFullYear().toString()
      + String(date.getMonth() + 1).padStart(2, '0')
      + String(date.getDate()).padStart(2, '0')
      + '_'
      + String(date.getHours()).padStart(2, '0')
      + String(date.getMinutes()).padStart(2, '0')
      + String(date.getSeconds()).padStart(2, '0');
  }

  /**
   * Save the HTML report.
   * @param filename  Base name for the report file (without timestamp or extension)
   * @param reportDir Optional pre-created directory to save into (reuses existing dir for screenshots)
   */
  saveReport(filename?: string, reportDir?: string) {
    const html = this.generateHTML();

    const ts = ReportGenerator.buildTimestamp();
    const dirPath = reportDir || `reports/${ts}`;
    mkdirSync(dirPath, { recursive: true });

    // Derive file name: test_name_timestamp.html
    const reportFileName = filename
      ? filename.replace(/\.html$/, '') + `_${ts}.html`
      : `report_${ts}.html`;

    const reportPath = `${dirPath}/${reportFileName}`;
    writeFileSync(reportPath, html);
    console.log(`\n📊 Report saved: ${reportPath}`);
    return reportPath;
  }

  get tests() {
    return this.data.tests;
  }
}
