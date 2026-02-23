/**
 * Generate YAML Template for Transaction
 *
 * Usage: npx tsx scripts/generate-template.ts <transaction> [output-file]
 * Example: npx tsx scripts/generate-template.ts ME21N my-po.yaml
 */

import { SAPTemplateGenerator } from '../src/sap-template-generator.js';

async function main() {
  const transaction = process.argv[2];
  const outputFile = process.argv[3];

  const generator = new SAPTemplateGenerator();

  if (!transaction) {
    console.log('Usage: npx tsx scripts/generate-template.ts <transaction> [output-file]');
    console.log('\nAvailable transactions:');
    generator.listAvailableTransactions().forEach(t => {
      console.log(`  - ${t}`);
    });
    process.exit(1);
  }

  if (outputFile) {
    generator.saveTemplate(transaction, outputFile);
    console.log(`\nTemplate generated: ${outputFile}`);
  } else {
    const template = generator.generateTemplate(transaction);
    console.log(template);
  }
}

main();
