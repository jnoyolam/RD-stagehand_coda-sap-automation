/**
 * Example 03: SAP Fiori - Search and Navigate
 *
 * This example demonstrates:
 * - Using Fiori Launchpad search functionality
 * - Searching for apps/tiles
 * - Navigating from search results
 *
 * Prerequisites:
 * - SAP Fiori system
 * - Valid SAP credentials
 */

import { SAPFioriAutomation } from './helper.js';

async function searchAndNavigate() {
  const sap = new SAPFioriAutomation({
    baseUrl: 'https://your-sap-fiori-system.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Search for an app using Fiori search
    await sap.searchAndNavigate('purchase order');

    console.log('✅ Successfully navigated via search');

    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default searchAndNavigate;
