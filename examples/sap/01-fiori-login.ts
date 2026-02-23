/**
 * Example 01: SAP Fiori Login
 *
 * This example demonstrates:
 * - Initializing SAP Fiori automation
 * - Logging into SAP Fiori Launchpad
 * - Waiting for UI5 framework to load
 * - Basic navigation
 *
 * Prerequisites:
 * - SAP Fiori system URL
 * - Valid SAP credentials
 * - Proxy server running (npm run proxy)
 */

import { SAPFioriAutomation } from './helper.js';

async function fioriLogin() {
  // Initialize SAP Fiori automation with your system URL
  const sap = new SAPFioriAutomation({
    baseUrl: 'https://ec2-184-73-255-6.compute-1.amazonaws.com:44300/sap/bc/ui2/flp?_sap-hash=JTIzU2hlbGwtaG9tZQ#Shell-home',
    client: '100', // Your SAP client (optional)
    language: 'EN' // Language code (optional)
  });

  try {
    // Initialize browser and SAP automation
    await sap.initialize();

    // Login to SAP Fiori
    // The LLM will automatically detect the login form fields
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    console.log('✅ Successfully logged into SAP Fiori Launchpad');

    // Wait a few seconds to see the Fiori Launchpad
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default fioriLogin;
