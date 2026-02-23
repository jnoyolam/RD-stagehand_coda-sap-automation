/**
 * Example 04: SAP Fiori - Extract Table Data
 *
 * This example demonstrates:
 * - Extracting data from Fiori tables
 * - Using schema validation for SAP data
 * - Handling UI5 table controls
 *
 * Prerequisites:
 * - SAP Fiori app with table data
 * - Valid SAP credentials
 */

import { SAPFioriAutomation } from './helper.js';
import { SAPMaterialListSchema } from '../../src/sap-schema-validators.js';

async function extractFioriTable() {
  const sap = new SAPFioriAutomation({
    baseUrl: 'https://ec2-184-73-255-6.compute-1.amazonaws.com:44300/sap/bc/ui2/flp?_sap-hash=JTIzU2hlbGwtaG9tZQ#Shell-home',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Navigate to an app with table data (e.g., Material Master)
    await sap.navigateToTile('Manage Materials');

    // Extract table data using schema
    const materials = await sap.extractTableData(SAPMaterialListSchema);

    console.log('✅ Extracted materials:');
    console.log(JSON.stringify(materials, null, 2));

    // You can also iterate through the data
    materials.materials.forEach((material, index) => {
      console.log(`Material ${index + 1}: ${material.materialNumber} - ${material.description}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

extractFioriTable();
