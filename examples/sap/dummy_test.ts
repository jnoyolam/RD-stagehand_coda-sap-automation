/**
 * Dummy Test: eBay Search
 *
 * This example demonstrates:
 * - Using the navigate function from helper.ts
 * - Navigating to eBay
 * - Performing a search for electronic devices
 */

import { SAPAutomation } from './helper.js';

async function dummyTest() {
  let sap: SAPAutomation | null = null;

  try {
    console.log('🚀 Starting eBay search test...');

    // Initialize SAP Automation
    console.log('\n📋 Initializing SAP Automation...');
    sap = new SAPAutomation({
      baseUrl: 'https://www.ebay.com',
      language: 'EN',
      enableSAPWaits: false // Disable SAP-specific waits for regular web
    });
    await sap.initialize();

    // Navigate to eBay using the navigate function
    console.log('\n🌐 Navigating to eBay.com...');
    await sap.navigate('https://www.ebay.com');

    // Perform search for electronic devices
    console.log('\n🔍 Searching for electronic devices...');
    await sap.act('type "electronic devices" in the search box');
    await sap.act('click the search button');

    // Wait for search results to load
    console.log('\n⏳ Waiting for search results...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n✅ eBay search test completed successfully!');

  } catch (error) {
    console.error('❌ Error in eBay search test:', error);
  } finally {
    if (sap) {
      console.log('\n🧹 Cleaning up...');
      await sap.cleanup();
    }
  }
}

// Run the test
dummyTest();

export default dummyTest;
