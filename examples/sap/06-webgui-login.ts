/**
 * Example 06: SAP WebGUI Login
 *
 * This example demonstrates:
 * - Initializing SAP WebGUI automation
 * - Logging into SAP GUI for HTML
 * - Basic WebGUI navigation
 *
 * Prerequisites:
 * - SAP WebGUI system URL
 * - Valid SAP credentials
 */

import { SAPWebGUIAutomation } from './helper.js';

async function webguiLogin() {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();

    // Login to SAP WebGUI
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    console.log('✅ Successfully logged into SAP WebGUI');

    // Wait to see the SAP Easy Access screen
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default webguiLogin;
