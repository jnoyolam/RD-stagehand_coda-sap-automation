/**
 * Example 13: SAP Fiori - Create Sales Order
 *
 * This example demonstrates:
 * - Searching for and navigating to sales order creation
 * - Filling out basic sales order fields using natural language actions
 *
 * Prerequisites:
 * - SAP Fiori system with sales order creation application
 * - Valid SAP credentials with sales order permissions
 */

import { SAPFioriAutomation } from './helper.js';
import dotenv from 'dotenv';

dotenv.config();

async function createSalesOrder() {
  // Read SAP credentials from environment variables
  const sapUsername = process.env.SAP_USERNAME;
  const sapPassword = process.env.SAP_PASSWORD;

  if (!sapUsername || !sapPassword) {
    throw new Error('Missing SAP credentials. Please set SAP_USERNAME and SAP_PASSWORD in .env file');
  }

  const sap = new SAPFioriAutomation({
    baseUrl: 'https://ec2-184-73-255-6.compute-1.amazonaws.com:44300/sap/bc/ui2/flp?_sap-hash=JTIzU2hlbGwtaG9tZQ#Shell-home',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();

    await sap.login(sapUsername, sapPassword);

    // Navigate to sales order creation application
    await sap.searchAndNavigate('Create Sales Order');

    await sap.act('Fill the Order Type field with "ZOR"');

    await sap.act('Fill the Sales Organization field with "1710"');

    await sap.act('Fill the Distribution Channel field with "10"');
    await sap.act('Fill the Division field with "00" and press Enter to confirm');

    await sap.act('Fill the Sold-to party field with ""');

    // TODO: add actions to fill in sales order fields

    console.log('✅ Successfully started create sales order example.');

    // Wait to see the app
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default createSalesOrder;