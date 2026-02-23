/**
 * SAP Batch Executor
 *
 * Execute multiple SAP transactions from YAML files in sequence or parallel.
 */

import { readdirSync } from 'fs';
import { join } from 'path';
import { SAPWebGUIAutomation, SAPFioriAutomation } from '../examples/sap/helper.js';
import { SAPTransactionExecutor, ExecutionResult } from './sap-transaction-executor.js';

export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: ExecutionResult[];
  duration: number;
}

export class SAPBatchExecutor {
  constructor(private sap: SAPWebGUIAutomation | SAPFioriAutomation) {}

  /**
   * Execute multiple YAML files in sequence
   */
  async executeBatch(yamlFiles: string[]): Promise<BatchResult> {
    const startTime = Date.now();
    const executor = new SAPTransactionExecutor(this.sap);
    const results: ExecutionResult[] = [];

    console.log(`\n=== Starting batch execution: ${yamlFiles.length} transactions ===\n`);

    for (const yamlFile of yamlFiles) {
      const result = await executor.executeFromYAML(yamlFile);
      results.push(result);
    }

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n=== Batch execution completed ===`);
    console.log(`Total: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

    return {
      total: results.length,
      successful,
      failed,
      results,
      duration
    };
  }

  /**
   * Execute all YAMLs in a directory
   */
  async executeDirectory(directory: string, pattern?: string): Promise<BatchResult> {
    let yamlFiles = readdirSync(directory)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map(f => join(directory, f));

    if (pattern) {
      yamlFiles = yamlFiles.filter(f => f.includes(pattern));
    }

    console.log(`Found ${yamlFiles.length} YAML files in ${directory}`);

    return await this.executeBatch(yamlFiles);
  }

  /**
   * Execute YAMLs in parallel (use with caution)
   */
  async executeParallel(yamlFiles: string[], maxConcurrent: number = 2): Promise<BatchResult> {
    const startTime = Date.now();
    const executor = new SAPTransactionExecutor(this.sap);
    const results: ExecutionResult[] = [];

    console.log(`\n=== Starting parallel execution: ${yamlFiles.length} transactions (max ${maxConcurrent} concurrent) ===\n`);

    for (let i = 0; i < yamlFiles.length; i += maxConcurrent) {
      const batch = yamlFiles.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(file => executor.executeFromYAML(file))
      );
      results.push(...batchResults);
    }

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n=== Parallel execution completed ===`);
    console.log(`Total: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

    return {
      total: results.length,
      successful,
      failed,
      results,
      duration
    };
  }
}
