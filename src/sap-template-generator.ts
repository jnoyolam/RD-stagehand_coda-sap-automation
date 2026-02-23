/**
 * SAP Template Generator
 *
 * Generate YAML templates for common SAP transactions.
 */

import { writeFileSync } from 'fs';

export class SAPTemplateGenerator {
  private templates: Record<string, string> = {
    // Material Management
    'MM01': this.templateMM01(),
    'MM02': this.templateMM02(),
    'MM03': this.templateMM03(),
    'ME21N': this.templateME21N(),
    'ME22N': this.templateME22N(),
    'ME23N': this.templateME23N(),
    'ME2N': this.templateME2N(),
    'MIGO': this.templateMIGO(),

    // Sales & Distribution
    'VA01': this.templateVA01(),
    'VA02': this.templateVA02(),
    'VA03': this.templateVA03(),
    'VL01N': this.templateVL01N(),
    'VF01': this.templateVF01(),

    // Finance
    'FB50': this.templateFB50(),
    'FB60': this.templateFB60(),
    'FB70': this.templateFB70(),
    'F-03': this.templateF03(),
    'FS00': this.templateFS00(),

    // Production Planning
    'CO01': this.templateCO01(),
    'CO02': this.templateCO02(),
    'CO03': this.templateCO03(),

    // Master Data
    'XK01': this.templateXK01(),
    'XK02': this.templateXK02(),
    'XD01': this.templateXD01(),
    'XD02': this.templateXD02(),

    // Inventory
    'MB51': this.templateMB51(),
    'MB52': this.templateMB52(),

    // Quality Management
    'QA01': this.templateQA01(),

    // Plant Maintenance
    'IW31': this.templateIW31()
  };

  generateTemplate(transaction: string): string {
    return this.templates[transaction] || this.templateGeneric(transaction);
  }

  saveTemplate(transaction: string, outputPath: string) {
    const template = this.generateTemplate(transaction);
    writeFileSync(outputPath, template);
    console.log(`Template saved: ${outputPath}`);
  }

  listAvailableTransactions(): string[] {
    return Object.keys(this.templates);
  }

  // Material Management Templates
  private templateMM01(): string {
    return `transaction: MM01
name: Create Material
description: Create new material master record

header:
  material_type: "FERT"
  industry_sector: "M"
  material: "AUTO-GEN"

basic_data:
  description: "New Material Description"
  base_unit: "EA"
  material_group: "001"

purchasing_data:
  purchasing_group: "001"
  plant: "1000"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateMM02(): string {
    return `transaction: MM02
name: Change Material
description: Change existing material master

header:
  material: "100-100"

changes:
  description: "Updated Description"
  material_group: "002"

options:
  save_after_creation: true
`;
  }

  private templateMM03(): string {
    return `transaction: MM03
name: Display Material
description: Display material master data

header:
  material: "100-100"

options:
  extract_document_number: false
`;
  }

  private templateME21N(): string {
    return `transaction: ME21N
name: Create Purchase Order
description: Create new purchase order

header:
  vendor: "1000"
  purchasing_organization: "1000"
  purchasing_group: "001"
  company_code: "1000"
  document_type: "NB"

items:
  - item_number: "10"
    material: "100-100"
    quantity: "10"
    unit: "EA"
    price: "99.99"
    delivery_date: "31.12.2025"
    plant: "1000"
    storage_location: "0001"

options:
  save_after_creation: true
  extract_document_number: true
  wait_for_confirmation: true

validations:
  check_status: "Created"
  verify_items_count: 1
`;
  }

  private templateME22N(): string {
    return `transaction: ME22N
name: Change Purchase Order
description: Change existing purchase order

header:
  purchase_order: "4500000001"

changes:
  item_10_quantity: "20"

options:
  save_after_creation: true
`;
  }

  private templateME23N(): string {
    return `transaction: ME23N
name: Display Purchase Order
description: Display purchase order details

header:
  purchase_order: "4500000001"

options:
  extract_document_number: false
`;
  }

  private templateME2N(): string {
    return `transaction: ME2N
name: Purchase Orders by Vendor
description: List purchase orders for a vendor

header:
  vendor: "1000"
  purchasing_organization: "1000"

options:
  extract_document_number: false
`;
  }

  private templateMIGO(): string {
    return `transaction: MIGO
name: Goods Movement
description: Post goods receipt or issue

header:
  movement_type: "101"
  purchase_order: "4500000001"
  posting_date: "31.12.2025"

items:
  - item_number: "1"
    quantity: "10"
    storage_location: "0001"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  // Sales & Distribution Templates
  private templateVA01(): string {
    return `transaction: VA01
name: Create Sales Order
description: Create new sales order

header:
  order_type: "OR"
  sales_organization: "1000"
  distribution_channel: "10"
  division: "00"
  sold_to_party: "1000"

items:
  - item_number: "10"
    material: "100-100"
    quantity: "5"
    unit: "EA"
    plant: "1000"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateVA02(): string {
    return `transaction: VA02
name: Change Sales Order
description: Change existing sales order

header:
  sales_order: "1000000001"

changes:
  item_10_quantity: "10"

options:
  save_after_creation: true
`;
  }

  private templateVA03(): string {
    return `transaction: VA03
name: Display Sales Order
description: Display sales order details

header:
  sales_order: "1000000001"

options:
  extract_document_number: false
`;
  }

  private templateVL01N(): string {
    return `transaction: VL01N
name: Create Delivery
description: Create outbound delivery

header:
  shipping_point: "1000"
  selection_date: "31.12.2025"
  sales_order: "1000000001"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateVF01(): string {
    return `transaction: VF01
name: Create Billing Document
description: Create invoice from delivery

header:
  billing_type: "F2"
  billing_date: "31.12.2025"
  delivery: "8000000001"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  // Finance Templates
  private templateFB50(): string {
    return `transaction: FB50
name: G/L Account Posting
description: Post to general ledger

header:
  document_date: "31.12.2025"
  posting_date: "31.12.2025"
  document_type: "SA"
  company_code: "1000"

items:
  - gl_account: "400000"
    amount: "1000.00"
    cost_center: "1000"
    debit_credit: "D"
  - gl_account: "113100"
    amount: "1000.00"
    debit_credit: "C"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateFB60(): string {
    return `transaction: FB60
name: Enter Incoming Invoice
description: Post vendor invoice

header:
  invoice_date: "31.12.2025"
  posting_date: "31.12.2025"
  vendor: "1000"
  amount: "1000.00"
  purchase_order: "4500000001"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateFB70(): string {
    return `transaction: FB70
name: Enter Outgoing Invoice
description: Post customer invoice

header:
  invoice_date: "31.12.2025"
  posting_date: "31.12.2025"
  customer: "1000"
  amount: "1000.00"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateF03(): string {
    return `transaction: F-03
name: Display Document
description: Display financial document

header:
  document_number: "1000000001"
  company_code: "1000"
  fiscal_year: "2025"

options:
  extract_document_number: false
`;
  }

  private templateFS00(): string {
    return `transaction: FS00
name: G/L Account Master
description: Display or change G/L account master

header:
  gl_account: "400000"
  company_code: "1000"

options:
  extract_document_number: false
`;
  }

  // Production Planning Templates
  private templateCO01(): string {
    return `transaction: CO01
name: Create Production Order
description: Create new production order

header:
  order_type: "PP01"
  material: "100-100"
  plant: "1000"
  quantity: "100"
  unit: "EA"
  start_date: "01.01.2026"
  finish_date: "31.01.2026"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateCO02(): string {
    return `transaction: CO02
name: Change Production Order
description: Change existing production order

header:
  production_order: "1000000001"

changes:
  quantity: "150"

options:
  save_after_creation: true
`;
  }

  private templateCO03(): string {
    return `transaction: CO03
name: Display Production Order
description: Display production order details

header:
  production_order: "1000000001"

options:
  extract_document_number: false
`;
  }

  // Master Data Templates
  private templateXK01(): string {
    return `transaction: XK01
name: Create Vendor
description: Create new vendor master record

header:
  vendor_account_group: "0001"
  company_code: "1000"
  purchasing_organization: "1000"

general_data:
  name: "New Vendor Name"
  street: "123 Main St"
  city: "New York"
  country: "US"
  postal_code: "10001"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateXK02(): string {
    return `transaction: XK02
name: Change Vendor
description: Change existing vendor master

header:
  vendor: "1000"

changes:
  name: "Updated Vendor Name"

options:
  save_after_creation: true
`;
  }

  private templateXD01(): string {
    return `transaction: XD01
name: Create Customer
description: Create new customer master record

header:
  customer_account_group: "0001"
  sales_organization: "1000"
  distribution_channel: "10"
  division: "00"

general_data:
  name: "New Customer Name"
  street: "456 Oak Ave"
  city: "Los Angeles"
  country: "US"
  postal_code: "90001"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateXD02(): string {
    return `transaction: XD02
name: Change Customer
description: Change existing customer master

header:
  customer: "1000"

changes:
  name: "Updated Customer Name"

options:
  save_after_creation: true
`;
  }

  // Inventory Templates
  private templateMB51(): string {
    return `transaction: MB51
name: Material Document List
description: Display material documents

header:
  material: "100-100"
  plant: "1000"
  movement_type: "101"
  posting_date_from: "01.01.2025"
  posting_date_to: "31.12.2025"

options:
  extract_document_number: false
`;
  }

  private templateMB52(): string {
    return `transaction: MB52
name: Display Stock
description: Display material stock overview

header:
  material: "100-100"
  plant: "1000"

options:
  extract_document_number: false
`;
  }

  // Quality Management
  private templateQA01(): string {
    return `transaction: QA01
name: Create Quality Notification
description: Create quality notification

header:
  notification_type: "Q1"
  material: "100-100"
  plant: "1000"

description:
  short_text: "Quality issue description"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  // Plant Maintenance
  private templateIW31(): string {
    return `transaction: IW31
name: Create Maintenance Order
description: Create maintenance order

header:
  order_type: "PM01"
  equipment: "1000000001"
  plant: "1000"

description:
  short_text: "Maintenance work description"

options:
  save_after_creation: true
  extract_document_number: true
`;
  }

  private templateGeneric(transaction: string): string {
    return `transaction: ${transaction}
name: Generic Transaction
description: Generic template for ${transaction}

header:
  field1: "value1"
  field2: "value2"

options:
  save_after_creation: true
  extract_document_number: false
`;
  }
}
