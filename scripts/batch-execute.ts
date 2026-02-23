/**
 * Execute Multiple YAML Transactions (Batch)
 *
 * Usage: npx tsx scripts/batch-execute.ts <directory>
 * Example: npx tsx scripts/batch-execute.ts sap-transactions/purchasing/
 */

import { SAPWebGUIAutomation } from '../examples/sap/helper.js';
import { SAPBatchExecutor } from '../src/sap-batch-executor.js';

async function main() {
  const directory = process.argv[2];

  if (!directory) {
    console.error('Usage: npx tsx scripts/batch-execute.ts <directory>');
    console.error('Example: npx tsx scripts/batch-execute.ts sap-transactions/purchasing/');
    process.exit(1);
  }

  const sap = new SAPWebGUIAutomation({
    baseUrl: process.env.SAP_WEBGUI_URL || 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
    client: process.env.SAP_CLIENT || '100',
    language: process.env.SAP_LANGUAGE || 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(
      process.env.SAP_USERNAME!,
      process.env.SAP_PASSWORD!
    );

    const batch = new SAPBatchExecutor(sap);
    const result = await batch.executeDirectory(directory);

    console.log('\n=== BATCH RESULTS ===');
    console.log(`Total: ${result.total}`);
    console.log(`Successful: ${result.successful}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);

    if (result.failed > 0) {
      console.log('\nFailed transactions:');
      result.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.transaction}: ${r.error}`);
        });
    }

  } finally {
    await sap.cleanup();
  }
}

main();
