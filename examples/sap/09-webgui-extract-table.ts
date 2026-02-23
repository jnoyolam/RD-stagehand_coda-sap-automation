/**
 * Example 09: SAP WebGUI - Extract Table Data
 *
 * This example demonstrates:
 * - Extracting data from SAP table controls
 * - Using SAP schemas for data validation
 * - Handling multiple rows
 *
 * Prerequisites:
 * - SAP WebGUI access
 * - Transaction with table data (e.g., ME2N - Purchase Orders by Vendor)
 */

import { SAPWebGUIAutomation } from './helper.js';
import { SAPPurchaseOrderSchema } from '../../src/sap-schema-validators.js';

async function extractTableData() {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Execute ME2N - Purchase Orders by Vendor
    await sap.executeTransaction('ME2N');

    // Enter vendor and execute
    await sap.fillForm({
      'Vendor': '1000' // Replace with valid vendor
    });

    await sap.act('click the execute button or press F8');

    // Extract table data
    const tableData = await sap.extractSAPTable(SAPPurchaseOrderSchema);

    console.log('✅ Purchase orders extracted:');
    console.log(JSON.stringify(tableData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default extractTableData;
