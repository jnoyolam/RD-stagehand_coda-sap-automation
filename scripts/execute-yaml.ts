/**
 * Execute Single YAML Transaction
 *
 * Usage: npx tsx scripts/execute-yaml.ts <yaml-file>
 * Example: npx tsx scripts/execute-yaml.ts sap-transactions/purchasing/ME21N-create-po.yaml
 */

import { SAPWebGUIAutomation } from '../examples/sap/helper.js';
import { SAPTransactionExecutor } from '../src/sap-transaction-executor.js';

async function main() {
  const yamlFile = process.argv[2];

  if (!yamlFile) {
    console.error('Usage: npx tsx scripts/execute-yaml.ts <yaml-file>');
    console.error('Example: npx tsx scripts/execute-yaml.ts sap-transactions/purchasing/ME21N-create-po.yaml');
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

    const executor = new SAPTransactionExecutor(sap);
    const result = await executor.executeFromYAML(yamlFile);

    if (result.success) {
      console.log('\n=== SUCCESS ===');
      console.log(`Transaction: ${result.transaction}`);
      if (result.documentNumber) {
        console.log(`Document Number: ${result.documentNumber}`);
      }
    } else {
      console.error('\n=== FAILED ===');
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }

  } finally {
    await sap.cleanup();
  }
}

main();
