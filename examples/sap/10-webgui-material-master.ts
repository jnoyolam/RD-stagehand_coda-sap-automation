/**
 * Example 10: SAP WebGUI - Material Master Data Extraction
 *
 * This example demonstrates:
 * - Displaying material master data (MM03)
 * - Extracting material information
 * - Using SAP material schema
 *
 * Prerequisites:
 * - SAP WebGUI access
 * - MM03 authorization
 * - Valid material numbers
 */

import { SAPWebGUIAutomation } from './helper.js';
import { SAPMaterialSchema } from '../../src/sap-schema-validators.js';

async function displayMaterialMaster() {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Execute MM03 - Display Material
    await sap.executeTransaction('MM03');

    // Enter material number
    await sap.fillForm({
      'Material': '100-100' // Replace with valid material
    });

    await sap.act('press enter or click continue');

    // Extract material data
    const material = await sap.extract(
      'extract material number, description, type, base unit, price, and stock information',
      SAPMaterialSchema
    );

    console.log('✅ Material master data extracted:');
    console.log(`Material: ${material.materialNumber}`);
    console.log(`Description: ${material.description}`);
    console.log(`Type: ${material.materialType}`);
    console.log(`Base UoM: ${material.baseUnitOfMeasure}`);
    console.log(`Price: ${material.price} ${material.currency}`);
    console.log(`Stock: ${material.stockQuantity}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default displayMaterialMaster;
