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

async function navigateToTile() {
  const sap = new SAPFioriAutomation({
    baseUrl: 'https://ec2-184-73-255-6.compute-1.amazonaws.com:44300/sap/bc/ui2/flp?_sap-hash=JTIzU2hlbGwtaG9tZQ#Shell-home',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();

    // Login
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Navigate to a specific tile by its name
    // Replace with an actual tile name from your Fiori Launchpad
    await sap.navigateToTile('Manage Purchase Orders');

    console.log('✅ Successfully navigated to tile');

    // Wait to see the app
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default navigateToTile;
