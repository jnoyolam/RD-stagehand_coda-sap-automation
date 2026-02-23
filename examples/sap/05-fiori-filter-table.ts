/**
 * Example 05: SAP Fiori - Filter and Sort Table
 *
 * This example demonstrates:
 * - Filtering Fiori tables
 * - Sorting table columns
 * - Extracting filtered results
 *
 * Prerequisites:
 * - SAP Fiori app with filterable table
 * - Valid SAP credentials
 */

import { SAPFioriAutomation } from './helper.js';
import { z } from 'zod';

async function filterAndSortTable() {
  const sap = new SAPFioriAutomation({
    baseUrl: 'https://your-sap-fiori-system.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html',
    client: '100',
    language: 'EN'
  });

  try {
    await sap.initialize();
    await sap.login(process.env.SAP_USERNAME!, process.env.SAP_PASSWORD!);

    // Navigate to app
    await sap.navigateToTile('Manage Purchase Orders');

    // Filter the table
    await sap.filterTable('Status: Open, Created Date: Last 30 days');

    // Sort by a column
    await sap.sortTable('Document Date', 'descending');

    // Extract filtered and sorted data
    const ResultSchema = z.object({
      rows: z.array(
        z.object({
          poNumber: z.string(),
          vendor: z.string(),
          amount: z.string(),
          status: z.string()
        })
      )
    });

    const data = await sap.extractTableData(ResultSchema);

    console.log('✅ Filtered and sorted data:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sap.cleanup();
  }
}

filterAndSortTable();
