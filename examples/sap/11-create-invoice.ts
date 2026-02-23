/**
 * Example 02: SAP Fiori - Navigate to Tile
 *
 * This example demonstrates:
 * - Navigating to a specific Fiori tile
 * - Using natural language to find tiles
 * - Waiting for Fiori apps to load
 *
 * Prerequisites:
 * - SAP Fiori system with configured tiles
 * - Valid SAP credentials
 */

import { SAPFioriAutomation } from './helper.js';
import dotenv from 'dotenv';

dotenv.config();

async function createInvoice() {
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

    await sap.navigateToTile('Create Outgoing Invoices');

    await sap.act('Fill customer field with "1000653"');

    const formattedDate = sap.getTodayFormattedDate();
    await sap.act(`Fill the Invoice date with ${formattedDate}`);
    await sap.act('Fill the Amount field with "1000"');

    await sap.act('Click on the first cell under G/L acct column in the bottom table.');
    await sap.keyboardType('39914000', { times: 1 });

    await sap.keyboard('Tab', { times: 3 });
    await sap.keyboardType('1000', { times: 1 });

    await sap.act('Click in the Post button to save the invoice');

    const invoiceNumber = await sap.extractText('Extract the Document number from the confirmation message at the bottom of the screen');
    console.log('✅ Invoice Number:', invoiceNumber);


    console.log('✅ Successfully invoice created.');

    // Wait to see the app
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default createInvoice;
