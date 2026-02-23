/**
 * Example 08: SAP WebGUI - Create Purchase Order
 *
 * This example demonstrates:
 * - Creating a purchase order in SAP
 * - Filling SAP forms
 * - Handling SAP dropdowns and fields
 * - Saving SAP documents
 *
 * Prerequisites:
 * - SAP WebGUI access
 * - ME21N authorization
 * - Valid vendor and material master data
 */

import { SAPWebGUIAutomation } from './helper.js';

async function createPurchaseOrder() {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Execute ME21N - Create Purchase Order
    await sap.executeTransaction('ME21N');

    // Fill header data
    await sap.fillForm({
      'Vendor': '1000', // Replace with valid vendor
      'Purchasing Organization': '1000',
      'Purchasing Group': '001',
      'Company Code': '1000'
    });

    // Add item data
    await sap.act('click the first item line');
    await sap.fillForm({
      'Material': '100-100', // Replace with valid material
      'Quantity': '10',
      'Delivery Date': '31.12.2025'
    });

    // Save the purchase order
    await sap.save();

    console.log('✅ Purchase order created successfully');

    // Extract the PO number
    await sap.act('look for the purchase order number in the status bar or message');

    // Take a screenshot for verification (if needed)
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default createPurchaseOrder;
