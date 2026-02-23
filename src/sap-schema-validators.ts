/**
 * SAP Schema Validators
 *
 * Pre-built Zod schemas for common SAP data structures.
 * Includes parsing, transformation, and validation logic.
 *
 * Usage:
 * ```typescript
 * import { SAPMaterialSchema, SAPPurchaseOrderSchema } from './src/sap-schema-validators.js';
 *
 * const material = await sapAutomation.extract('get material data', SAPMaterialSchema);
 * const orders = await sapAutomation.extract('get purchase orders', SAPPurchaseOrderSchema);
 * ```
 */

import { z } from 'zod';

/**
 * Common SAP field transformations
 */

/** Remove SAP internal formatting from numbers */
const sapNumberTransform = z.string().transform((val) => {
  const cleaned = val.replace(/[^\d.-]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
});

/** Parse SAP date format (DD.MM.YYYY or YYYY-MM-DD) */
const sapDateTransform = z.string().transform((val) => {
  if (!val) return null;

  // Handle DD.MM.YYYY format
  if (val.includes('.')) {
    const [day, month, year] = val.split('.');
    return new Date(`${year}-${month}-${day}`);
  }

  // Handle YYYY-MM-DD format
  return new Date(val);
});

/** Clean SAP currency values */
const sapCurrencyTransform = z.string().transform((val) => {
  const cleaned = val.replace(/[^\d.,-]/g, '');
  return cleaned ? parseFloat(cleaned.replace(',', '.')) : 0;
});

/** Parse SAP boolean values */
const sapBooleanTransform = z.string().transform((val) => {
  const normalized = val.toLowerCase().trim();
  return normalized === 'x' || normalized === 'yes' || normalized === 'true' || normalized === '1';
});

/**
 * SAP Material Master Data Schema
 */
export const SAPMaterialSchema = z.object({
  materialNumber: z.string().describe('Material number'),
  description: z.string().describe('Material description'),
  materialType: z.string().optional().describe('Material type (e.g., FERT, ROH)'),
  baseUnitOfMeasure: z.string().optional().describe('Base UoM'),
  materialGroup: z.string().optional().describe('Material group'),
  plant: z.string().optional().describe('Plant'),
  storageLocation: z.string().optional().describe('Storage location'),
  price: z.string().optional().describe('Price'),
  currency: z.string().optional().describe('Currency code'),
  stockQuantity: z.string().optional().describe('Stock quantity'),
  createdOn: z.string().optional().describe('Creation date'),
  createdBy: z.string().optional().describe('Created by user'),
  lastChanged: z.string().optional().describe('Last change date'),
  changedBy: z.string().optional().describe('Changed by user')
});

export type SAPMaterial = z.infer<typeof SAPMaterialSchema>;

/**
 * SAP Material List Schema (multiple materials)
 */
export const SAPMaterialListSchema = z.object({
  materials: z.array(SAPMaterialSchema)
});

export type SAPMaterialList = z.infer<typeof SAPMaterialListSchema>;

/**
 * SAP Purchase Order Schema
 */
export const SAPPurchaseOrderSchema = z.object({
  purchaseOrder: z.string().describe('Purchase order number'),
  vendor: z.string().describe('Vendor code/number'),
  vendorName: z.string().optional().describe('Vendor name'),
  documentDate: z.string().optional().describe('Document date'),
  items: z.array(
    z.object({
      itemNumber: z.string().describe('Item number'),
      materialNumber: z.string().describe('Material number'),
      description: z.string().describe('Short text'),
      quantity: z.string().describe('Order quantity'),
      unit: z.string().describe('Unit of measure'),
      price: z.string().describe('Net price'),
      totalValue: z.string().optional().describe('Net value'),
      deliveryDate: z.string().optional().describe('Delivery date'),
      plant: z.string().optional().describe('Plant'),
      storageLocation: z.string().optional().describe('Storage location')
    })
  ).describe('Purchase order items'),
  totalValue: z.string().optional().describe('Total order value'),
  currency: z.string().optional().describe('Currency'),
  purchasingOrg: z.string().optional().describe('Purchasing organization'),
  purchasingGroup: z.string().optional().describe('Purchasing group'),
  createdBy: z.string().optional().describe('Created by'),
  createdOn: z.string().optional().describe('Created on')
});

export type SAPPurchaseOrder = z.infer<typeof SAPPurchaseOrderSchema>;

/**
 * SAP Sales Order Schema
 */
export const SAPSalesOrderSchema = z.object({
  salesOrder: z.string().describe('Sales order number'),
  soldToParty: z.string().describe('Sold-to party'),
  customerName: z.string().optional().describe('Customer name'),
  documentDate: z.string().optional().describe('Document date'),
  items: z.array(
    z.object({
      itemNumber: z.string().describe('Item number'),
      materialNumber: z.string().describe('Material number'),
      description: z.string().describe('Material description'),
      quantity: z.string().describe('Order quantity'),
      unit: z.string().describe('Sales unit'),
      netPrice: z.string().describe('Net price'),
      netValue: z.string().optional().describe('Net value'),
      requestedDeliveryDate: z.string().optional().describe('Requested delivery date'),
      plant: z.string().optional().describe('Plant')
    })
  ).describe('Sales order items'),
  totalNetValue: z.string().optional().describe('Total net value'),
  currency: z.string().optional().describe('Document currency'),
  salesOrg: z.string().optional().describe('Sales organization'),
  distributionChannel: z.string().optional().describe('Distribution channel'),
  division: z.string().optional().describe('Division'),
  createdBy: z.string().optional().describe('Created by'),
  createdOn: z.string().optional().describe('Created on')
});

export type SAPSalesOrder = z.infer<typeof SAPSalesOrderSchema>;

/**
 * SAP Vendor Master Data Schema
 */
export const SAPVendorSchema = z.object({
  vendorNumber: z.string().describe('Vendor number'),
  name: z.string().describe('Vendor name'),
  searchTerm: z.string().optional().describe('Search term'),
  street: z.string().optional().describe('Street'),
  city: z.string().optional().describe('City'),
  postalCode: z.string().optional().describe('Postal code'),
  country: z.string().optional().describe('Country'),
  region: z.string().optional().describe('Region'),
  telephone: z.string().optional().describe('Telephone'),
  fax: z.string().optional().describe('Fax'),
  email: z.string().optional().describe('Email'),
  currency: z.string().optional().describe('Currency'),
  paymentTerms: z.string().optional().describe('Payment terms'),
  accountGroup: z.string().optional().describe('Account group'),
  createdOn: z.string().optional().describe('Created on'),
  createdBy: z.string().optional().describe('Created by')
});

export type SAPVendor = z.infer<typeof SAPVendorSchema>;

/**
 * SAP Customer Master Data Schema
 */
export const SAPCustomerSchema = z.object({
  customerNumber: z.string().describe('Customer number'),
  name: z.string().describe('Customer name'),
  searchTerm: z.string().optional().describe('Search term'),
  street: z.string().optional().describe('Street'),
  city: z.string().optional().describe('City'),
  postalCode: z.string().optional().describe('Postal code'),
  country: z.string().optional().describe('Country'),
  region: z.string().optional().describe('Region'),
  telephone: z.string().optional().describe('Telephone'),
  email: z.string().optional().describe('Email'),
  currency: z.string().optional().describe('Currency'),
  paymentTerms: z.string().optional().describe('Payment terms'),
  accountGroup: z.string().optional().describe('Account group'),
  salesOrg: z.string().optional().describe('Sales organization'),
  distributionChannel: z.string().optional().describe('Distribution channel'),
  division: z.string().optional().describe('Division'),
  createdOn: z.string().optional().describe('Created on'),
  createdBy: z.string().optional().describe('Created by')
});

export type SAPCustomer = z.infer<typeof SAPCustomerSchema>;

/**
 * SAP Invoice Schema
 */
export const SAPInvoiceSchema = z.object({
  invoiceNumber: z.string().describe('Invoice document number'),
  fiscalYear: z.string().optional().describe('Fiscal year'),
  invoiceDate: z.string().optional().describe('Invoice date'),
  postingDate: z.string().optional().describe('Posting date'),
  vendorNumber: z.string().optional().describe('Vendor number'),
  customerNumber: z.string().optional().describe('Customer number'),
  companyCode: z.string().optional().describe('Company code'),
  amount: z.string().describe('Invoice amount'),
  currency: z.string().describe('Currency'),
  taxAmount: z.string().optional().describe('Tax amount'),
  reference: z.string().optional().describe('Reference'),
  paymentTerms: z.string().optional().describe('Payment terms'),
  dueDate: z.string().optional().describe('Due date'),
  status: z.string().optional().describe('Document status'),
  createdBy: z.string().optional().describe('Created by'),
  createdOn: z.string().optional().describe('Created on')
});

export type SAPInvoice = z.infer<typeof SAPInvoiceSchema>;

/**
 * SAP Financial Document Schema (FI Document)
 */
export const SAPFIDocumentSchema = z.object({
  documentNumber: z.string().describe('Document number'),
  companyCode: z.string().describe('Company code'),
  fiscalYear: z.string().describe('Fiscal year'),
  documentDate: z.string().optional().describe('Document date'),
  postingDate: z.string().optional().describe('Posting date'),
  reference: z.string().optional().describe('Reference'),
  documentType: z.string().optional().describe('Document type'),
  items: z.array(
    z.object({
      lineItem: z.string().describe('Line item number'),
      glAccount: z.string().describe('G/L account'),
      accountDescription: z.string().optional().describe('Account description'),
      debitAmount: z.string().optional().describe('Debit amount'),
      creditAmount: z.string().optional().describe('Credit amount'),
      currency: z.string().optional().describe('Currency'),
      costCenter: z.string().optional().describe('Cost center'),
      profitCenter: z.string().optional().describe('Profit center'),
      text: z.string().optional().describe('Item text')
    })
  ).optional().describe('Document line items'),
  currency: z.string().optional().describe('Document currency'),
  enteredBy: z.string().optional().describe('Entered by'),
  enteredOn: z.string().optional().describe('Entry date')
});

export type SAPFIDocument = z.infer<typeof SAPFIDocumentSchema>;

/**
 * SAP Table Generic Schema
 * Use this for extracting data from any SAP table when structure is flexible
 */
export const SAPTableSchema = z.object({
  rows: z.array(
    z.record(z.string(), z.any())
  ).describe('Table rows with dynamic columns')
});

export type SAPTable = z.infer<typeof SAPTableSchema>;

/**
 * SAP User Schema
 */
export const SAPUserSchema = z.object({
  username: z.string().describe('User ID'),
  firstName: z.string().optional().describe('First name'),
  lastName: z.string().optional().describe('Last name'),
  email: z.string().optional().describe('Email address'),
  telephone: z.string().optional().describe('Telephone'),
  department: z.string().optional().describe('Department'),
  validFrom: z.string().optional().describe('Valid from date'),
  validTo: z.string().optional().describe('Valid to date'),
  userGroup: z.string().optional().describe('User group'),
  accountType: z.string().optional().describe('Account type'),
  locked: z.string().optional().describe('User locked status'),
  lastLogon: z.string().optional().describe('Last logon date')
});

export type SAPUser = z.infer<typeof SAPUserSchema>;

/**
 * SAP Fiori Notification Schema
 */
export const SAPFioriNotificationSchema = z.object({
  id: z.string().describe('Notification ID'),
  title: z.string().describe('Notification title'),
  description: z.string().optional().describe('Notification description'),
  priority: z.string().optional().describe('Priority (High, Medium, Low)'),
  date: z.string().optional().describe('Notification date'),
  isRead: z.string().optional().describe('Read status'),
  type: z.string().optional().describe('Notification type'),
  actionUrl: z.string().optional().describe('Action URL')
});

export type SAPFioriNotification = z.infer<typeof SAPFioriNotificationSchema>;

/**
 * SAP Fiori Notifications List Schema
 */
export const SAPFioriNotificationsSchema = z.object({
  notifications: z.array(SAPFioriNotificationSchema),
  unreadCount: z.number().optional().describe('Count of unread notifications')
});

export type SAPFioriNotifications = z.infer<typeof SAPFioriNotificationsSchema>;

/**
 * SAP Workflow Item Schema
 */
export const SAPWorkflowItemSchema = z.object({
  workItemId: z.string().describe('Work item ID'),
  taskDescription: z.string().describe('Task description'),
  creator: z.string().optional().describe('Creator'),
  createdOn: z.string().optional().describe('Created on'),
  priority: z.string().optional().describe('Priority'),
  dueDate: z.string().optional().describe('Due date'),
  status: z.string().optional().describe('Status'),
  forwardedFrom: z.string().optional().describe('Forwarded from')
});

export type SAPWorkflowItem = z.infer<typeof SAPWorkflowItemSchema>;

/**
 * SAP Production Order Schema
 */
export const SAPProductionOrderSchema = z.object({
  orderNumber: z.string().describe('Production order number'),
  orderType: z.string().optional().describe('Order type'),
  material: z.string().describe('Material number'),
  description: z.string().optional().describe('Material description'),
  plant: z.string().describe('Plant'),
  plannedQuantity: z.string().describe('Planned order quantity'),
  unit: z.string().describe('Unit of measure'),
  startDate: z.string().optional().describe('Basic start date'),
  endDate: z.string().optional().describe('Basic finish date'),
  status: z.string().optional().describe('System status'),
  createdBy: z.string().optional().describe('Created by'),
  createdOn: z.string().optional().describe('Created on')
});

export type SAPProductionOrder = z.infer<typeof SAPProductionOrderSchema>;

/**
 * Helper function to create custom SAP table schema
 */
export function createSAPTableSchema<T extends z.ZodRawShape>(columns: T) {
  return z.object({
    rows: z.array(z.object(columns))
  });
}

/**
 * Example usage:
 * const CustomTableSchema = createSAPTableSchema({
 *   column1: z.string(),
 *   column2: sapNumberTransform,
 *   column3: sapDateTransform
 * });
 */
