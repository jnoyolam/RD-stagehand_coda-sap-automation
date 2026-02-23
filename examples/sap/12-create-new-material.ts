/**
 * Example 12: SAP Fiori - Create New Material
 *
 * This example demonstrates:
 * - Searching for and navigating to material creation
 * - Using natural language to find applications
 * - Filling out material master data
 *
 * Prerequisites:
 * - SAP Fiori system with material management tiles
 * - Valid SAP credentials with material creation permissions
 */

import { SAPFioriAutomation } from './helper.js';
import dotenv from 'dotenv';

dotenv.config();

async function createNewMaterial() {
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

    // Search for material creation application
    await sap.searchAndNavigate('Create Material');

    // Fill basic material data
    await sap.act('Fill material field with "Test Material - Automation"');
    await sap.act('Expand the Indusry sector dropdown and select "Mechanical Engineering"');
    await sap.act('Expand the Material Type dropdown and select "Finished Product"');

    // Navigate to additional views if needed
    await sap.act('Marck the Basic Data 1 checkbox and click on the continue button');
    await sap.act('Fill the description field with "This material was created using Stagehand automation"');
    await sap.act('Fill Base Unit of Measure with "EA" (Each)');

    // Save the material
    await sap.act('Click Save button');

    const materialNumber = await sap.extractText('Extract the material number from the success message');
    console.log('✅ Material Number:', materialNumber);

    console.log('✅ Successfully created new material.');

    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

export default createNewMaterial;