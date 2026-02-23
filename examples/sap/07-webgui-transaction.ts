/**
 * Example 07: SAP WebGUI - Execute Transaction
 *
 * This example demonstrates:
 * - Executing SAP transaction codes (T-codes)
 * - Navigating through SAP screens
 * - Using transaction field
 *
 * Prerequisites:
 * - SAP WebGUI access
 * - Valid SAP credentials
 * - Authorization for transactions
 */

import { SAPWebGUIAutomation } from './helper.js';

async function executeTransaction() {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Execute transaction ME21N (Create Purchase Order)
    await sap.executeTransaction('ME21N');

    console.log('✅ Transaction ME21N executed');

    // Wait to see the transaction screen
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Navigate back
    await sap.navigateBack();

    console.log('✅ Navigated back');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default executeTransaction;
