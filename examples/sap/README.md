# SAP Automation Examples

This directory contains comprehensive examples for automating SAP systems using the Stagehand framework with LLM-powered natural language automation.

## Supported SAP Systems

- **SAP Fiori** - Modern UI5-based applications
- **SAP WebGUI** - Classic SAP GUI for HTML
- **SAP S/4HANA** - Both Fiori and WebGUI interfaces
- **SAP Business One** - Web-based interface

## Architecture

### Class Hierarchy

```
SAPAutomation (Base Class)
├── SAPFioriAutomation (UI5/Fiori specific)
└── SAPWebGUIAutomation (WebGUI specific)
```

### Key Components

1. **Helper Classes** (`helper.ts`)
   - `SAPAutomation` - Base class with core SAP functionality
   - `SAPFioriAutomation` - Fiori-specific methods
   - `SAPWebGUIAutomation` - WebGUI-specific methods

2. **Schema Validators** (`src/sap-schema-validators.ts`)
   - Pre-built Zod schemas for SAP data structures
   - Automatic data transformation (dates, numbers, currency)
   - Type-safe data extraction

3. **Examples** (10 working examples)
   - Fiori examples: 01-05
   - WebGUI examples: 06-10

## Quick Start

### 1. Prerequisites

```bash
# Start the proxy server (Terminal 1)
npm run proxy

# Configure your SAP system details
# Edit the examples and replace:
# - baseUrl: Your SAP system URL
# - client: Your SAP client number
# - YOUR_USERNAME: Your SAP username
# - YOUR_PASSWORD: Your SAP password
```

### 2. Run Examples

```bash
# Fiori Examples
npx tsx examples/sap/01-fiori-login.ts
npx tsx examples/sap/02-fiori-navigate-tile.ts
npx tsx examples/sap/04-fiori-extract-table.ts

# WebGUI Examples
npx tsx examples/sap/06-webgui-login.ts
npx tsx examples/sap/07-webgui-transaction.ts
npx tsx examples/sap/08-webgui-create-po.ts
```

### 3. Run Test Suites

```bash
# Fiori test suite
npm run suite test-suites/sap-fiori-suite.yaml

# WebGUI test suite
npm run suite test-suites/sap-webgui-suite.yaml

# Complete SAP test suite
npm run suite test-suites/sap-full-suite.yaml
```

## Example Overview

### SAP Fiori Examples

| Example | Description | Key Features |
|---------|-------------|--------------|
| 01-fiori-login.ts | Login to Fiori Launchpad | UI5 detection, session management |
| 02-fiori-navigate-tile.ts | Navigate to Fiori tile | Natural language tile finding |
| 03-fiori-search-navigate.ts | Search and navigate | Launchpad search functionality |
| 04-fiori-extract-table.ts | Extract table data | Schema validation, UI5 tables |
| 05-fiori-filter-table.ts | Filter and sort tables | Dynamic filtering, sorting |

### SAP WebGUI Examples

| Example | Description | Key Features |
|---------|-------------|--------------|
| 06-webgui-login.ts | Login to WebGUI | Classic SAP login |
| 07-webgui-transaction.ts | Execute transaction codes | T-code navigation |
| 08-webgui-create-po.ts | Create purchase order | Form filling, document creation |
| 09-webgui-extract-table.ts | Extract table data | SAP table controls |
| 10-webgui-material-master.ts | Display material master | Master data extraction |

## Usage Patterns

### Pattern 1: SAP Fiori Automation

```typescript
import { SAPFioriAutomation } from './helper.js';
import { SAPMaterialListSchema } from '../../src/sap-schema-validators.js';

const sap = new SAPFioriAutomation({
  baseUrl: 'https://your-sap-system.com/fiori',
  client: '100',
  language: 'EN'
});

await sap.initialize();
await sap.login('username', 'password');
await sap.navigateToTile('Manage Materials');

const materials = await sap.extractTableData(SAPMaterialListSchema);
console.log(materials);

await sap.cleanup();
```

### Pattern 2: SAP WebGUI Automation

```typescript
import { SAPWebGUIAutomation } from './helper.js';

const sap = new SAPWebGUIAutomation({
  baseUrl: 'https://your-sap-system.com/sap/bc/gui/sap/its/webgui',
  client: '100',
  language: 'EN'
});

await sap.initialize();
await sap.login('username', 'password');
await sap.executeTransaction('ME21N');

await sap.fillForm({
  'Vendor': '1000',
  'Material': '100-100',
  'Quantity': '10'
});

await sap.save();
await sap.cleanup();
```

### Pattern 3: Data Extraction with Schemas

```typescript
import { SAPPurchaseOrderSchema } from '../../src/sap-schema-validators.js';

// Extract with automatic validation and transformation
const poData = await sap.extract(
  'extract purchase order details including items',
  SAPPurchaseOrderSchema
);

// Data is type-safe and validated
console.log(`PO: ${poData.purchaseOrder}`);
console.log(`Vendor: ${poData.vendorName}`);
poData.items.forEach(item => {
  console.log(`${item.materialNumber}: ${item.quantity} ${item.unit}`);
});
```

## Available Schemas

Located in `src/sap-schema-validators.ts`:

- `SAPMaterialSchema` - Material master data
- `SAPPurchaseOrderSchema` - Purchase orders
- `SAPSalesOrderSchema` - Sales orders
- `SAPVendorSchema` - Vendor master data
- `SAPCustomerSchema` - Customer master data
- `SAPInvoiceSchema` - Invoice documents
- `SAPFIDocumentSchema` - Financial documents
- `SAPUserSchema` - User data
- `SAPProductionOrderSchema` - Production orders
- `SAPWorkflowItemSchema` - Workflow items
- `SAPFioriNotificationSchema` - Fiori notifications

## SAP-Specific Features

### UI5 Framework Detection

The `SAPFioriAutomation` class automatically waits for:
- SAP UI5 core to load
- UI5 components to initialize
- Busy indicators to disappear
- React/Vue framework readiness (if used)

### WebGUI Controls

The `SAPWebGUIAutomation` class handles:
- SAP table controls (grid controls)
- SAP-specific input fields
- Transaction code navigation
- F-key equivalents (F3=Back, F8=Execute, etc.)
- Popup/dialog handling

### Smart Waits

Both classes implement SAP-specific waits:
- Busy indicator detection
- UI5 rendering completion
- Network activity monitoring
- JavaScript framework readiness

## Configuration Options

```typescript
interface SAPConfig {
  baseUrl: string;          // SAP system URL (required)
  client?: string;          // SAP client number (e.g., "100")
  language?: string;        // Language code (e.g., "EN", "ES", "DE")
  enableSAPWaits?: boolean; // Enable SAP-specific waits (default: true)
  sessionTimeout?: number;  // Session timeout in ms (default: 300000)
}
```

## Best Practices

### 1. Always Use Try-Finally for Cleanup

```typescript
try {
  await sap.initialize();
  // ... your automation code
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

### 3. Use Schemas for Data Extraction

```typescript
// DON'T: Untyped extraction
const data = await sap.extract('get data', z.any());

// DO: Use pre-built schemas
const data = await sap.extract('get material data', SAPMaterialSchema);
```

### 4. Handle SAP Sessions

```typescript
// Set appropriate session timeout
const sap = new SAPAutomation({
  baseUrl: 'https://sap-system.com',
  sessionTimeout: 600000 // 10 minutes for long operations
});
```

## Common SAP Transactions

### Material Management (MM)
- `MM01` - Create Material
- `MM02` - Change Material
- `MM03` - Display Material
- `ME21N` - Create Purchase Order
- `ME22N` - Change Purchase Order
- `ME23N` - Display Purchase Order
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

## Troubleshooting

### Issue: UI5 framework not loading
```typescript
// Solution: Increase timeout
const sap = new SAPFioriAutomation({
  baseUrl: 'https://sap-system.com'
});

// Wait manually if needed
await sap.page.waitForTimeout(5000);
await sap.waitForUI5Ready();
```

### Issue: Transaction not found
```typescript
// Solution: Verify transaction authorization
await sap.executeTransaction('ME21N');
// Check SAP user has authorization for ME21N
```

### Issue: Element not found
```typescript
// Solution: Use more specific instructions
// Instead of:
await sap.act('click button');

// Use:
await sap.act('click the save button in the toolbar');
```

## Additional Resources

- [Stagehand Framework Documentation](../../README.md)
- [SAP Fiori Design Guidelines](https://experience.sap.com/fiori-design-web/)
- [SAP Transaction Codes Reference](https://www.tcodesearch.com/)
- [UI5 Documentation](https://ui5.sap.com/)

## Support

For issues or questions:
1. Check the main [README.md](../../README.md)
2. Review example code in this directory
3. Consult SAP-specific schemas in `src/sap-schema-validators.ts`
4. Review helper class methods in `helper.ts`

## Contributing

To add new SAP examples:
1. Follow the existing naming convention (`##-description.ts`)
2. Include detailed comments
3. Use appropriate schemas from `sap-schema-validators.ts`
4. Add to the relevant test suite YAML file
5. Update this README

## License

MIT
