# SAP Automation - Quick Start Guide

> **Get started with SAP automation in 5 minutes**

## Prerequisites

- Node.js 18+
- Chrome browser
- SAP system access (Fiori or WebGUI)
- CODA GEAI API key

## Step 1: Install

```bash
npm install
```

## Step 2: Configure

Create `.env` file:

```bash
CODA_GEAI_API_KEY='your_api_key_here'
CODA_GEAI_BASE_URL='https://api.beta.saia.ai'
CODA_MODEL=gpt-4o
CODA_PROVIDER=openai
```

## Step 3: Start Proxy

**Terminal 1** - Keep this running:

```bash
npm run proxy
```

You should see:
```
╔═══════════════════════════════════════════════════╗
║  CODA GEAI Proxy Server Running                   ║
║  Port: 3456                                       ║
╚═══════════════════════════════════════════════════╝
```

## Step 4: Run Your First Example

**Terminal 2** - Choose your SAP system:

### For SAP Fiori:

```bash
npm run fiori:login
```

### For SAP WebGUI:

```bash
npm run webgui:login
```

## Step 5: Configure Your SAP System

Edit the example file you want to run:

```typescript
// examples/sap/01-fiori-login.ts or examples/sap/06-webgui-login.ts

const sap = new SAPFioriAutomation({
  baseUrl: 'https://YOUR-SAP-SYSTEM.com/fiori',  // Change this
  client: '100',                                  // Your SAP client
  language: 'EN'                                  // Your language
});

await sap.login('YOUR_USERNAME', 'YOUR_PASSWORD'); // Change credentials
```

## Available Commands

### YAML Transactions
```bash
npm run yaml:execute <file>  # Execute single YAML transaction
npm run yaml:batch <dir>     # Batch execute directory
npm run yaml:generate <tc>   # Generate template for transaction
```

### Fiori Examples
```bash
npm run fiori:login          # Login to Fiori
npm run fiori:tile           # Navigate to tile
npm run fiori:search         # Search apps
npm run fiori:table          # Extract table
npm run fiori:filter         # Filter & sort
```

### WebGUI Examples
```bash
npm run webgui:login         # Login to WebGUI
npm run webgui:transaction   # Execute T-code
npm run webgui:create-po     # Create PO (ME21N)
npm run webgui:table         # Extract table
npm run webgui:material      # Display material (MM03)
```

### Test Suites
```bash
npm run suite:fiori          # Run Fiori tests
npm run suite:webgui         # Run WebGUI tests
npm run suite:all            # Run all tests
```

## Common Issues

### Proxy Not Running
```
Error: ECONNREFUSED localhost:3456
```
**Solution:** Make sure proxy is running in Terminal 1: `npm run proxy`

### Chrome Not Found
```bash
# macOS
brew install --cask google-chrome

# Or install Playwright browsers
npx playwright install chromium
```

### Invalid Credentials
Edit the example file and update:
- `baseUrl` - Your SAP system URL
- Username and password
- Client number (if required)

## Quick Example: YAML Transaction

1. Generate a template:
```bash
npm run yaml:generate ME21N my-po.yaml
```

2. Edit `my-po.yaml` with your data:
```yaml
transaction: ME21N
header:
  vendor: "1000"
  purchasing_organization: "1000"
items:
  - material: "100-100"
    quantity: "10"
    price: "99.99"
```

3. Execute:
```bash
npm run yaml:execute my-po.yaml
```

## Next Steps

1. -  Proxy running
2. -  First example working
3. * Read full [README.md](README.md) for:
   - Complete API reference
   - Common scenarios
   - Data extraction guide
   - Troubleshooting

4. * Customize examples for your needs
5. * Create your own automation scripts

## Example: Complete Automation

```typescript
import { SAPFioriAutomation } from './examples/sap/helper.js';
import { SAPPurchaseOrderSchema } from './src/sap-schema-validators.js';

async function automateMyTask() {
  const sap = new SAPFioriAutomation({
    baseUrl: 'https://your-sap-system.com/fiori',
    client: '100',
    language: 'EN'
  });

  try {
    // Initialize and login
    await sap.initialize();
    await sap.login('username', 'password');

    // Navigate to app
    await sap.navigateToTile('Manage Purchase Orders');

    // Filter data
    await sap.filterTable('Status: Open');

    // Extract data
    const orders = await sap.extractTableData(SAPPurchaseOrderSchema);

    // Process results
    console.log(`Found ${orders.length} open orders`);
    orders.forEach(order => {
      console.log(`PO: ${order.purchaseOrder}, Vendor: ${order.vendorName}`);
    });

  } finally {
    await sap.cleanup();
  }
}

automateMyTask();
```

## Need Help?

- * Full documentation: [README.md](README.md)
- 📁 Example code: `examples/sap/`
- * Helper classes: `examples/sap/helper.ts`
- * Schemas: `src/sap-schema-validators.ts`

---

**Happy Automating! ***
