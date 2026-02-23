# SAP Automation Framework

> **LLM-powered SAP automation using natural language commands**
> Automate SAP Fiori and SAP WebGUI with AI - no brittle selectors, self-healing tests

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## * What is This?

This framework enables SAP automation using natural language instead of fragile CSS selectors. Built on Stagehand with LLM capabilities, it understands SAP-specific elements and adapts to UI changes automatically.

**Traditional Automation:**
```typescript
await page.click('#__button23-inner'); // Breaks when SAP changes IDs
await page.fill('input[data-sap-ui="orderInput"]', 'value'); // Brittle
```

**Natural Language Automation:**
```typescript
await sap.act('click the save button');
await sap.act('type "1000" in the vendor field');
// Works even when SAP UI changes
```

## * Key Features

### * SAP Fiori Support
- -  **UI5 Framework Detection** - Automatic waiting for SAP UI5 to initialize
- -  **Fiori Launchpad** - Navigate tiles, search apps, extract data
- -  **Smart Tables** - Filter, sort, and extract data from UI5 tables
- -  **Busy Indicators** - Automatic detection of SAP loading states
- -  **Responsive Design** - Works with all Fiori screen sizes

### * SAP WebGUI Support
- -  **Transaction Codes** - Execute any T-code programmatically (ME21N, MM03, VA01...)
- -  **Form Automation** - Fill SAP forms using natural language
- -  **Table Controls** - Extract data from SAP table controls
- -  **Toolbar Actions** - Click buttons, navigate, save documents
- -  **Dialog Handling** - Automatic popup and dialog detection

### * Production-Ready
- -  **Automatic Retry** - Exponential backoff for transient failures
- -  **Schema Validation** - 15+ pre-built Zod schemas for SAP data
- -  **Session Management** - Configurable timeouts and keep-alive
- -  **Error Recovery** - Smart error detection and recovery
- -  **Resource Cleanup** - Automatic browser cleanup on crashes

## * Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [YAML-Based Transactions](#-yaml-based-transactions)
- [SAP Fiori Automation](#-sap-fiori-automation)
- [SAP WebGUI Automation](#️-sap-webgui-automation)
- [Data Extraction](#-data-extraction)
- [Common Scenarios](#-common-sap-scenarios)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Examples](#-examples)

## * Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd stagehand-test
git checkout sap-automation
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
# Required
CODA_GEAI_API_KEY='your_api_key_here'
CODA_GEAI_BASE_URL='https://api.beta.saia.ai'
CODA_MODEL=gpt-4o
CODA_PROVIDER=openai

# Optional (defaults shown)
RETRY_MAX_ATTEMPTS=3
WAIT_TIMEOUT=30000
TEST_MAX_CONCURRENCY=2
```

### 3. Start Proxy Server

```bash
# Terminal 1 - Keep this running
npm run proxy
```

### 4. Run Your First SAP Automation

```bash
# Terminal 2 - Run examples
npm run fiori:login
npm run webgui:login

# Or execute YAML-based transactions
npm run yaml:execute sap-transactions/purchasing/ME21N-create-po.yaml
```

## * Installation

### Prerequisites

- Node.js 18 or higher
- Chrome browser (or Chromium)
- SAP system access (Fiori or WebGUI)
- CODA GEAI API key

### Install Dependencies

```bash
npm install
```

### Dependencies Installed

- `@browserbasehq/stagehand` - Browser automation with LLM
- `playwright` - Browser automation engine
- `zod` - Schema validation
- `express` - Proxy server
- `dotenv` - Environment configuration

## * Configuration

### Environment Variables

```bash
# Required Configuration
CODA_GEAI_API_KEY='your_key'          # Your CODA API key
CODA_GEAI_BASE_URL='https://api.beta.saia.ai'
CODA_MODEL=gpt-4o                     # LLM model
CODA_PROVIDER=openai                  # Provider

# Retry Settings (Optional)
RETRY_MAX_ATTEMPTS=3                  # Max retry attempts
RETRY_BASE_DELAY=1000                 # Initial delay (ms)
RETRY_MAX_DELAY=10000                 # Max delay cap (ms)

# Wait Settings (Optional)
WAIT_TIMEOUT=30000                    # Max wait time (ms)
WAIT_POLL_INTERVAL=100                # Polling interval (ms)
WAIT_NETWORK_IDLE_TIMEOUT=2000        # Network idle timeout (ms)

# Test Suite Settings (Optional)
TEST_MAX_CONCURRENCY=2                # Parallel test execution
TEST_DEFAULT_TIMEOUT=120000           # Test timeout (ms)
```

### SAP System Configuration

When initializing automation, provide SAP system details:

```typescript
const sap = new SAPFioriAutomation({
  baseUrl: 'https://your-sap-system.com/fiori',  // Required
  client: '100',                                  // Optional (SAP client)
  language: 'EN',                                 // Optional (language)
  enableSAPWaits: true,                          // Optional (SAP-specific waits)
  sessionTimeout: 300000                          // Optional (5 min default)
});
```

## * YAML-Based Transactions

Execute SAP transactions using YAML configuration files. Configure transaction data in YAML files and let the framework handle execution.

### Available Templates

30+ pre-built transaction templates in `sap-transactions/`:

**Materials**: MM01, MM02, MM03, ME21N, ME22N, ME23N, ME2N, MIGO
**Sales**: VA01, VA02, VA03, VL01N, VF01
**Finance**: FB50, FB60, FB70, F-03, FS00
**Production**: CO01, CO02, CO03
**Master Data**: XK01, XK02, XD01, XD02
**Inventory**: MB51, MB52
**Quality**: QA01
**Maintenance**: IW31

### Generate Template

```bash
npm run yaml:generate ME21N my-purchase-order.yaml
```

### Execute Single Transaction

```bash
npm run yaml:execute sap-transactions/purchasing/ME21N-create-po.yaml
```

### Batch Execute Transactions

```bash
npm run yaml:batch sap-transactions/purchasing/
```

### YAML Structure Example

```yaml
transaction: ME21N
name: Create Purchase Order
description: Create new purchase order

header:
  vendor: "1000"
  purchasing_organization: "1000"
  purchasing_group: "001"
  company_code: "1000"

items:
  - item_number: "10"
    material: "100-100"
    quantity: "10"
    price: "99.99"
    plant: "1000"

options:
  save_after_creation: true
  extract_document_number: true
  wait_for_confirmation: true
```

### Programmatic Usage

```typescript
import { SAPTransactionExecutor } from './src/sap-transaction-executor.js';
import { SAPWebGUIAutomation } from './examples/sap/helper.js';

const sap = new SAPWebGUIAutomation({
  baseUrl: process.env.SAP_WEBGUI_URL,
  client: '100',
  language: 'EN'
});

await sap.initialize();
await sap.login(username, password);

const executor = new SAPTransactionExecutor(sap);
const result = await executor.executeFromYAML('sap-transactions/purchasing/ME21N-create-po.yaml');

console.log(result.success ? 'Success!' : 'Failed');
console.log('Document Number:', result.documentNumber);
```

### How YAML Execution Works

The framework uses a hybrid approach combining fixed logic with LLM-powered element detection:

**1. Framework reads YAML configuration:**
```yaml
header:
  vendor: "1000"
  material: "100-100"
```

**2. Executor converts YAML data to natural language commands:**
```typescript
// src/sap-transaction-executor.ts
private async fillHeaderData(header: Record<string, string>) {
  for (const [field, value] of Object.entries(header)) {
    await this.sap.act(`type "${value}" in the ${field} field`);
  }
}
```

**3. Stagehand + LLM executes the action:**
- Stagehand receives: `type "1000" in the vendor field`
- LLM identifies which element on SAP screen is the "vendor field"
- Playwright performs the actual browser action (click, type, etc.)

**Execution flow:**
```
YAML (data) → TypeScript (logic) → Natural Language (commands) → LLM (element detection) → Playwright (browser actions)
```

**Key components:**
- **YAML files**: Store transaction data only (no logic)
- **TypeScript classes**: Contain execution logic and action sequences
- **Natural language**: Bridge between logic and UI elements
- **LLM**: Dynamically finds UI elements even when SAP changes IDs/classes
- **Playwright**: Performs actual browser automation

This approach makes automation resilient to SAP UI changes while keeping transaction data easily configurable.

## * SAP Fiori Automation

### Step-by-Step Guide

#### Step 1: Initialize Fiori Automation

```typescript
import { SAPFioriAutomation } from './examples/sap/helper.js';

const sap = new SAPFioriAutomation({
  baseUrl: 'https://your-sap-system.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html',
  client: '100',
  language: 'EN'
});

await sap.initialize();
```

#### Step 2: Login

```typescript
await sap.login('YOUR_USERNAME', 'YOUR_PASSWORD');
```

#### Step 3: Navigate to App

**Option A: Navigate by Tile Name**
```typescript
await sap.navigateToTile('Manage Purchase Orders');
```

**Option B: Search and Navigate**
```typescript
await sap.searchAndNavigate('purchase orders');
```

#### Step 4: Interact with UI

```typescript
// Filter table
await sap.filterTable('Status: Open, Created Date: Last 30 days');

// Sort table
await sap.sortTable('Document Date', 'descending');

// Click elements
await sap.act('click the create button');
await sap.act('type "Test Order" in the description field');
```

#### Step 5: Extract Data

```typescript
import { SAPPurchaseOrderSchema } from './src/sap-schema-validators.js';

const orders = await sap.extractTableData(SAPPurchaseOrderSchema);

console.log(`Found ${orders.length} orders`);
orders.forEach(order => {
  console.log(`PO: ${order.purchaseOrder}, Vendor: ${order.vendorName}`);
});
```

#### Step 6: Cleanup

```typescript
await sap.cleanup();
```

### Complete Fiori Example

```typescript
import { SAPFioriAutomation } from './examples/sap/helper.js';
import { SAPMaterialListSchema } from './src/sap-schema-validators.js';

async function automateF iori() {
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
    await sap.navigateToTile('Manage Materials');

    // Filter data
    await sap.filterTable('Material Type: FERT');

    // Extract data
    const materials = await sap.extractTableData(SAPMaterialListSchema);

    // Process results
    console.log(`Found ${materials.materials.length} finished goods`);
    materials.materials.forEach(mat => {
      console.log(`${mat.materialNumber}: ${mat.description} - ${mat.price} ${mat.currency}`);
    });

  } finally {
    await sap.cleanup();
  }
}

automateF iori();
```

## * SAP WebGUI Automation

### Step-by-Step Guide

#### Step 1: Initialize WebGUI Automation

```typescript
import { SAPWebGUIAutomation } from './examples/sap/helper.js';

const sap = new SAPWebGUIAutomation({
  baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
  client: '100',
  language: 'EN'
});

await sap.initialize();
```

#### Step 2: Login

```typescript
await sap.login('YOUR_USERNAME', 'YOUR_PASSWORD');
```

#### Step 3: Execute Transaction

```typescript
// Execute any SAP transaction code
await sap.executeTransaction('ME21N');  // Create Purchase Order
await sap.executeTransaction('MM03');   // Display Material
await sap.executeTransaction('VA01');   // Create Sales Order
```

#### Step 4: Fill SAP Forms

```typescript
// Fill multiple fields at once
await sap.fillForm({
  'Vendor': '1000',
  'Purchasing Organization': '1000',
  'Purchasing Group': '001',
  'Company Code': '1000'
});

// Or fill individual fields
await sap.act('type "1000" in the vendor field');
await sap.act('type "10" in the quantity field');
```

#### Step 5: Interact with SAP Elements

```typescript
// Click toolbar buttons
await sap.clickToolbarButton('Save');
await sap.clickToolbarButton('Execute');

// Select from dropdown
await sap.selectFromDropdown('Document Type', 'NB - Standard PO');

// Check checkbox
await sap.checkCheckbox('Final Delivery');

// Handle popups
await sap.handlePopup('accept'); // Click OK/Yes
await sap.handlePopup('cancel'); // Click Cancel/No
```

#### Step 6: Extract Data

```typescript
import { SAPMaterialSchema } from './src/sap-schema-validators.js';

const material = await sap.extract(
  'extract material number, description, type, and price',
  SAPMaterialSchema
);

console.log(`Material: ${material.materialNumber}`);
console.log(`Description: ${material.description}`);
console.log(`Price: ${material.price} ${material.currency}`);
```

#### Step 7: Navigate

```typescript
// Go back (F3)
await sap.navigateBack();

// Save (Ctrl+S)
await sap.save();
```

#### Step 8: Cleanup

```typescript
await sap.cleanup();
```

### Complete WebGUI Example

```typescript
import { SAPWebGUIAutomation } from './examples/sap/helper.js';

async function createPurchaseOrder() {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100',
    language: 'EN'
  });

  try {
    // Initialize and login
    await sap.initialize();
    await sap.login('username', 'password');

    // Execute ME21N - Create Purchase Order
    await sap.executeTransaction('ME21N');

    // Fill header data
    await sap.fillForm({
      'Vendor': '1000',
      'Purchasing Organization': '1000',
      'Purchasing Group': '001',
      'Company Code': '1000'
    });

    // Fill first item
    await sap.act('click the first item line');
    await sap.fillForm({
      'Material': '100-100',
      'Quantity': '10',
      'Delivery Date': '31.12.2025'
    });

    // Save
    await sap.save();

    console.log('-  Purchase order created successfully');

  } finally {
    await sap.cleanup();
  }
}

createPurchaseOrder();
```

## * Data Extraction

### Available Schemas

The framework includes 15+ pre-built schemas:

```typescript
import {
  // Master Data
  SAPMaterialSchema,
  SAPMaterialListSchema,
  SAPVendorSchema,
  SAPCustomerSchema,
  SAPUserSchema,

  // Transactional Data
  SAPPurchaseOrderSchema,
  SAPSalesOrderSchema,
  SAPInvoiceSchema,
  SAPProductionOrderSchema,

  // Financial Data
  SAPFIDocumentSchema,

  // Workflow & Notifications
  SAPWorkflowItemSchema,
  SAPFioriNotificationSchema,
  SAPFioriNotificationsSchema,

  // Utilities
  SAPTableSchema,
  createSAPTableSchema
} from './src/sap-schema-validators.js';
```

### Schema Usage Examples

#### Example 1: Extract Material Master

```typescript
const material = await sap.extract(
  'get material number, description, type, base unit, and price',
  SAPMaterialSchema
);

console.log(material.materialNumber);  // "100-100"
console.log(material.description);      // "Laptop Computer"
console.log(material.price);            // "999.00"
console.log(material.currency);         // "USD"
```

#### Example 2: Extract Purchase Order

```typescript
const po = await sap.extract(
  'extract purchase order with all items',
  SAPPurchaseOrderSchema
);

console.log(`PO: ${po.purchaseOrder}`);
console.log(`Vendor: ${po.vendorName}`);
console.log(`Total: ${po.totalValue} ${po.currency}`);

po.items.forEach(item => {
  console.log(`- ${item.materialNumber}: ${item.quantity} ${item.unit} @ ${item.price}`);
});
```

#### Example 3: Extract Table Data

```typescript
// Extract all rows from a table
const materials = await sap.extractTableData(SAPMaterialListSchema);

materials.materials.forEach(mat => {
  console.log(`${mat.materialNumber}: ${mat.description}`);
});
```

#### Example 4: Custom Schema

```typescript
import { z } from 'zod';

const CustomSchema = z.object({
  orderNumber: z.string(),
  customer: z.string(),
  total: z.string(),
  status: z.string()
});

const data = await sap.extract(
  'extract order number, customer, total, and status',
  CustomSchema
);
```

## * Common SAP Scenarios

### Scenario 1: Create Purchase Order (ME21N)

```typescript
async function createPO() {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100'
  });

  await sap.initialize();
  await sap.login('user', 'pass');

  await sap.executeTransaction('ME21N');

  await sap.fillForm({
    'Vendor': '1000',
    'Purchasing Organization': '1000',
    'Purchasing Group': '001'
  });

  await sap.act('click first item line');
  await sap.fillForm({
    'Material': '100-100',
    'Quantity': '5'
  });

  await sap.save();
  await sap.cleanup();
}
```

### Scenario 2: Display Material Master (MM03)

```typescript
async function displayMaterial(materialNumber) {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100'
  });

  await sap.initialize();
  await sap.login('user', 'pass');

  await sap.executeTransaction('MM03');
  await sap.act(`type "${materialNumber}" in material field`);
  await sap.act('press enter');

  const material = await sap.extract(
    'get material data',
    SAPMaterialSchema
  );

  console.log(material);
  await sap.cleanup();
}
```

### Scenario 3: Extract Purchase Orders List (ME2N)

```typescript
async function extractPOList(vendorNumber) {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100'
  });

  await sap.initialize();
  await sap.login('user', 'pass');

  await sap.executeTransaction('ME2N');
  await sap.fillForm({ 'Vendor': vendorNumber });
  await sap.act('press F8 to execute');

  const orders = await sap.extractSAPTable(SAPPurchaseOrderSchema);

  console.log(`Found ${orders.length} purchase orders`);
  await sap.cleanup();
}
```

### Scenario 4: Fiori - Monitor Open Sales Orders

```typescript
async function monitorSalesOrders() {
  const sap = new SAPFioriAutomation({
    baseUrl: 'https://sap-system.com/fiori',
    client: '100'
  });

  await sap.initialize();
  await sap.login('user', 'pass');

  await sap.navigateToTile('Manage Sales Orders');
  await sap.filterTable('Status: Open, Created: Last 7 days');
  await sap.sortTable('Order Value', 'descending');

  const orders = await sap.extractTableData(SAPSalesOrderSchema);

  orders.forEach(order => {
    console.log(`Order: ${order.salesOrder}, Customer: ${order.customerName}, Value: ${order.totalNetValue}`);
  });

  await sap.cleanup();
}
```

### Scenario 5: Bulk Material Creation

```typescript
async function bulkCreateMaterials(materials) {
  const sap = new SAPWebGUIAutomation({
    baseUrl: 'https://sap-system.com/sap/bc/gui/sap/its/webgui',
    client: '100'
  });

  await sap.initialize();
  await sap.login('user', 'pass');

  for (const mat of materials) {
    await sap.executeTransaction('MM01');

    await sap.fillForm({
      'Material Type': mat.type,
      'Industry Sector': mat.industry,
      'Material': mat.number
    });

    await sap.act('press enter');

    await sap.fillForm({
      'Description': mat.description,
      'Base Unit of Measure': mat.unit
    });

    await sap.save();
    console.log(`Created material: ${mat.number}`);
  }

  await sap.cleanup();
}
```

## 📚 API Reference

### SAPFioriAutomation

```typescript
class SAPFioriAutomation {
  constructor(config: SAPConfig)

  // Core Methods
  async initialize(): Promise<void>
  async cleanup(): Promise<void>
  async login(username: string, password: string): Promise<void>

  // Navigation
  async navigate(url: string): Promise<void>
  async navigateToTile(tileName: string): Promise<void>
  async searchAndNavigate(searchTerm: string): Promise<void>

  // Actions
  async act(instruction: string): Promise<void>
  async observe(instruction: string): Promise<any[]>

  // Data Extraction
  async extract<T>(instruction: string, schema: ZodSchema<T>): Promise<T>
  async extractTableData<T>(schema: ZodSchema<T>): Promise<T>

  // Table Operations
  async filterTable(filterCriteria: string): Promise<void>
  async sortTable(columnName: string, direction: 'ascending' | 'descending'): Promise<void>

  // Waits
  async waitForUI5Ready(): Promise<void>
  async waitForSAPReady(): Promise<void>
}
```

### SAPWebGUIAutomation

```typescript
class SAPWebGUIAutomation {
  constructor(config: SAPConfig)

  // Core Methods
  async initialize(): Promise<void>
  async cleanup(): Promise<void>
  async login(username: string, password: string): Promise<void>

  // Navigation
  async navigate(url: string): Promise<void>
  async executeTransaction(tcode: string): Promise<void>
  async navigateBack(): Promise<void>

  // Actions
  async act(instruction: string): Promise<void>
  async observe(instruction: string): Promise<any[]>
  async save(): Promise<void>

  // Form Operations
  async fillForm(fields: Record<string, string>): Promise<void>
  async selectFromDropdown(label: string, value: string): Promise<void>
  async checkCheckbox(label: string): Promise<void>
  async clickToolbarButton(buttonName: string): Promise<void>

  // Data Extraction
  async extract<T>(instruction: string, schema: ZodSchema<T>): Promise<T>
  async extractSAPTable<T>(schema: ZodSchema<T>): Promise<T>

  // Dialog Handling
  async handlePopup(action: 'accept' | 'cancel'): Promise<void>

  // Waits
  async waitForSAPReady(): Promise<void>
}
```

### Configuration Interface

```typescript
interface SAPConfig {
  baseUrl: string;              // Required: SAP system URL
  client?: string;              // Optional: SAP client (e.g., "100")
  language?: string;            // Optional: Language code (e.g., "EN")
  enableSAPWaits?: boolean;     // Optional: Enable SAP waits (default: true)
  sessionTimeout?: number;      // Optional: Session timeout in ms (default: 300000)
}
```

## * Troubleshooting

### Issue: Proxy Connection Refused

**Symptom:**
```
Error: ECONNREFUSED localhost:3456
```

**Solution:**
```bash
# Start proxy server in separate terminal
npm run proxy

# Verify proxy is running
curl http://localhost:3456/health
```

### Issue: UI5 Framework Not Loading

**Symptom:**
```
Error: ui5 framework not loaded
```

**Solution:**
```typescript
// Increase timeout
const sap = new SAPFioriAutomation({
  baseUrl: 'https://sap-system.com',
  sessionTimeout: 600000 // 10 minutes
});

// Manual wait if needed
await sap.page.waitForTimeout(5000);
await sap.waitForUI5Ready();
```

### Issue: Transaction Authorization

**Symptom:**
```
Error: Transaction ME21N not authorized
```

**Solution:**
- Check user has authorization for transaction
- Use SU53 in SAP to check authorization errors
- Use SU01 to verify user roles

### Issue: Element Not Found

**Symptom:**
```
Error: Could not find element
```

**Solution:**
```typescript
// Use more specific instructions
// Instead of:
await sap.act('click button');

// Use:
await sap.act('click the green save button in the toolbar');
await sap.act('click the button with checkmark icon');
```

### Issue: Session Timeout

**Symptom:**
```
Error: SAP session expired
```

**Solution:**
```typescript
// Increase session timeout
const sap = new SAPAutomation({
  baseUrl: 'https://sap-system.com',
  sessionTimeout: 900000 // 15 minutes
});
```

### Issue: TypeScript Compilation Errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npx tsc --noEmit
```

## * Examples

### Run Individual Examples

```bash
# Fiori Examples
npm run fiori:login          # Login to Fiori Launchpad
npm run fiori:tile           # Navigate to tile
npm run fiori:search         # Search and navigate
npm run fiori:table          # Extract table data
npm run fiori:filter         # Filter and sort tables

# WebGUI Examples
npm run webgui:login         # Login to WebGUI
npm run webgui:transaction   # Execute transaction
npm run webgui:create-po     # Create purchase order
npm run webgui:table         # Extract table data
npm run webgui:material      # Display material master
```

### Run Test Suites

```bash
# Run Fiori test suite
npm run suite:fiori

# Run WebGUI test suite
npm run suite:webgui

# Run all tests
npm run suite:all
```

### Example Files

All examples are in `examples/sap/`:
- `01-fiori-login.ts` - Fiori login
- `02-fiori-navigate-tile.ts` - Tile navigation
- `03-fiori-search-navigate.ts` - Launchpad search
- `04-fiori-extract-table.ts` - Table extraction
- `05-fiori-filter-table.ts` - Table filtering/sorting
- `06-webgui-login.ts` - WebGUI login
- `07-webgui-transaction.ts` - Transaction execution
- `08-webgui-create-po.ts` - Create PO (ME21N)
- `09-webgui-extract-table.ts` - Table extraction
- `10-webgui-material-master.ts` - Material display (MM03)

## * Best Practices

### 1. Always Use Try-Finally

```typescript
try {
  await sap.initialize();
  // Your automation code
} finally {
  await sap.cleanup(); // Always cleanup
}
```

### 2. Split Multi-Step Actions

```typescript
// DON'T: Combined actions may fail
await sap.act('type "value" and press enter');

// DO: Split into separate actions
await sap.act('type "value" in the field');
await sap.act('press enter');
```

### 3. Use Pre-Built Schemas

```typescript
// DON'T: Untyped extraction
const data = await sap.extract('get data', z.any());

// DO: Use type-safe schemas
const data = await sap.extract('get material data', SAPMaterialSchema);
```

### 4. Use Environment Variables

```typescript
// DON'T: Hardcode credentials
await sap.login('myuser', 'mypassword');

// DO: Use environment variables
await sap.login(
  process.env.SAP_USERNAME!,
  process.env.SAP_PASSWORD!
);
```

### 5. Handle SAP Sessions Properly

```typescript
// Set appropriate timeout for long operations
const sap = new SAPAutomation({
  baseUrl: 'https://sap-system.com',
  sessionTimeout: 600000 // 10 minutes for long operations
});
```

## * Security

### Credential Management

```bash
# .env file (never commit!)
SAP_USERNAME=your_username
SAP_PASSWORD=your_password
SAP_CLIENT=100
SAP_FIORI_URL=https://your-sap-system.com/fiori
SAP_WEBGUI_URL=https://your-sap-system.com/sap/bc/gui/sap/its/webgui
```

### .gitignore

Ensure `.env` is in `.gitignore`:
```
.env
*.env
.env.local
```

## * Common SAP Transactions

### Material Management (MM)
- `MM01` - Create Material
- `MM02` - Change Material
- `MM03` - Display Material
- `ME21N` - Create Purchase Order
- `ME22N` - Change Purchase Order
- `ME23N` - Display Purchase Order
- `ME2N` - Purchase Orders by Vendor
- `MIGO` - Goods Movement

### Sales & Distribution (SD)
- `VA01` - Create Sales Order
- `VA02` - Change Sales Order
- `VA03` - Display Sales Order
- `VL01N` - Create Delivery
- `VF01` - Create Billing Document

### Finance (FI)
- `FB50` - G/L Account Posting
- `FB60` - Enter Incoming Invoice
- `FB70` - Enter Outgoing Invoice
- `F-03` - Display Document
- `FS00` - G/L Account Master

### Production Planning (PP)
- `CO01` - Create Production Order
- `CO02` - Change Production Order
- `CO03` - Display Production Order

## * Support

For issues or questions:
1. Check this README
2. Review examples in `examples/sap/`
3. Check schemas in `src/sap-schema-validators.ts`
4. Review helper methods in `examples/sap/helper.ts`

## * License

MIT

## * Acknowledgments

Built on:
- [Stagehand](https://github.com/browserbase/stagehand) - Browser automation framework
- [Playwright](https://playwright.dev/) - Browser automation
- [Zod](https://zod.dev/) - Schema validation
- CODA GEAI - LLM provider

---

**Made with * for SAP Automation**
