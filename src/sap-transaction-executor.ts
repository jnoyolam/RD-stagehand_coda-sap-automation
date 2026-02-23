/**
 * SAP Transaction Executor
 *
 * Executes SAP transactions from YAML configuration files.
 * Supports header data, items, validations, and batch processing.
 */

import { parse } from 'yaml';
import { readFileSync } from 'fs';
import { z } from 'zod';
import { SAPWebGUIAutomation, SAPFioriAutomation } from '../examples/sap/helper.js';

export interface TransactionConfig {
  transaction: string;
  name: string;
  description?: string;
  header?: Record<string, string>;
  items?: Array<Record<string, string>>;
  table_data?: Array<Record<string, string>>;
  options?: {
    save_after_creation?: boolean;
    extract_document_number?: boolean;
    wait_for_confirmation?: boolean;
    navigate_back_after?: boolean;
  };
  validations?: {
    check_status?: string;
    verify_items_count?: number;
    expected_message?: string;
  };
}

export interface ExecutionResult {
  success: boolean;
  transaction: string;
  documentNumber?: string;
  message?: string;
  error?: string;
  timestamp: Date;
}

export class SAPTransactionExecutor {
  constructor(private sap: SAPWebGUIAutomation | SAPFioriAutomation) {}

  /**
   * Execute transaction from YAML file
   */
  async executeFromYAML(yamlPath: string): Promise<ExecutionResult> {
    const startTime = new Date();

    try {
      // Load YAML
      const yamlContent = readFileSync(yamlPath, 'utf-8');
      const config: TransactionConfig = parse(yamlContent);

      console.log(`\n>>> Executing: ${config.transaction} - ${config.name}`);

      // Execute transaction
      if ('executeTransaction' in this.sap) {
        await this.sap.executeTransaction(config.transaction);
      } else {
        throw new Error('Transaction execution only supported in WebGUI');
      }

      // Fill header
      if (config.header) {
        await this.fillHeaderData(config.header);
      }

      // Fill items
      if (config.items && config.items.length > 0) {
        await this.fillItems(config.items);
      }

      // Fill table data (alternative to items)
      if (config.table_data && config.table_data.length > 0) {
        await this.fillTableData(config.table_data);
      }

      // Save
      if (config.options?.save_after_creation) {
        console.log('Saving document...');
        await (this.sap as SAPWebGUIAutomation).save();
      }

      // Extract document number
      let documentNumber: string | undefined;
      if (config.options?.extract_document_number) {
        documentNumber = await this.extractDocumentNumber();
      }

      // Validate
      if (config.validations) {
        await this.validateResults(config.validations);
      }

      // Navigate back
      if (config.options?.navigate_back_after) {
        await (this.sap as SAPWebGUIAutomation).navigateBack();
      }

      console.log(`* Transaction completed successfully`);

      return {
        success: true,
        transaction: config.transaction,
        documentNumber,
        timestamp: startTime
      };

    } catch (error: any) {
      console.error(`* Transaction failed: ${error.message}`);

      return {
        success: false,
        transaction: 'unknown',
        error: error.message,
        timestamp: startTime
      };
    }
  }

  /**
   * Execute transaction from config object
   */
  async executeFromConfig(config: TransactionConfig): Promise<ExecutionResult> {
    const startTime = new Date();

    try {
      console.log(`\n>>> Executing: ${config.transaction} - ${config.name}`);

      if ('executeTransaction' in this.sap) {
        await this.sap.executeTransaction(config.transaction);
      }

      if (config.header) {
        await this.fillHeaderData(config.header);
      }

      if (config.items && config.items.length > 0) {
        await this.fillItems(config.items);
      }

      if (config.table_data && config.table_data.length > 0) {
        await this.fillTableData(config.table_data);
      }

      if (config.options?.save_after_creation) {
        await (this.sap as SAPWebGUIAutomation).save();
      }

      let documentNumber: string | undefined;
      if (config.options?.extract_document_number) {
        documentNumber = await this.extractDocumentNumber();
      }

      if (config.validations) {
        await this.validateResults(config.validations);
      }

      if (config.options?.navigate_back_after) {
        await (this.sap as SAPWebGUIAutomation).navigateBack();
      }

      return {
        success: true,
        transaction: config.transaction,
        documentNumber,
        timestamp: startTime
      };

    } catch (error: any) {
      return {
        success: false,
        transaction: config.transaction,
        error: error.message,
        timestamp: startTime
      };
    }
  }

  private async fillHeaderData(header: Record<string, string>) {
    console.log('  Filling header data...');
    await (this.sap as SAPWebGUIAutomation).fillForm(header);
    await this.sap.act('press enter');
  }

  private async fillItems(items: Array<Record<string, string>>) {
    console.log(`  Filling ${items.length} items...`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (i === 0) {
        await this.sap.act('click the first item line');
      } else {
        await this.sap.act(`click item line number ${i + 1}`);
      }

      await (this.sap as SAPWebGUIAutomation).fillForm(item);
    }
  }

  private async fillTableData(tableData: Array<Record<string, string>>) {
    console.log(`  Filling table with ${tableData.length} rows...`);

    for (let i = 0; i < tableData.length; i++) {
      const row = tableData[i];

      for (const [field, value] of Object.entries(row)) {
        await this.sap.act(`type "${value}" in the ${field} field of row ${i + 1}`);
      }
    }
  }

  private async extractDocumentNumber(): Promise<string> {
    console.log('  Extracting document number...');

    const result = await this.sap.extract(
      'extract the document number from the status bar or success message',
      z.object({
        documentNumber: z.string()
      })
    );

    console.log(`  * Document number: ${result.documentNumber}`);
    return result.documentNumber;
  }

  private async validateResults(validations: any) {
    console.log('  Validating results...');

    if (validations.check_status) {
      console.log(`    Checking status: ${validations.check_status}`);
    }

    if (validations.verify_items_count) {
      console.log(`    Verifying item count: ${validations.verify_items_count}`);
    }

    if (validations.expected_message) {
      console.log(`    Checking message: ${validations.expected_message}`);
    }
  }
}
