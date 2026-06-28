export interface Client {
  id?: string;
  name: string;
  email: string;
  billingAddress: string;
  taxId: string;
  gstin?: string;
  pan?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  price: number;
  taxRate: number; // Percentage, e.g. 18 for 18%
  taxAmount: number; // (Price * Quantity) * (TaxRate / 100)
  total: number; // (Price * Quantity) + TaxAmount
}

export interface BaseDocument {
  id?: string;
  clientRef: any; // Type as any for compatibility between string ID (frontend) and ObjectId (Mongoose)
  clientInfo: Omit<Client, 'id'>; // Snapshot profile for historical consistency
  items: LineItem[];
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  issueDate: Date | string;
  dueDate: Date | string;
}

export type BillingDocumentType = 'QUOTATION' | 'PROFORMA' | 'FINAL_INVOICE';

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'CONVERTED' | 'EXPIRED';
export type ProformaStatus = 'DRAFT' | 'SENT' | 'CONVERTED' | 'EXPIRED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'VOID' | 'OVERDUE';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface Invoice extends BaseDocument {
  documentType: BillingDocumentType;
  documentNumber: string;
  status: QuotationStatus | ProformaStatus | InvoiceStatus;
  
  // Tracing fields
  quotationRef?: any;
  proformaRef?: any;
  
  // Type-specific optional fields
  validUntil?: Date | string;
  paymentStatus?: PaymentStatus;
  paymentDate?: Date | string;
}

// Kept for legacy model compatibility
export interface Quotation extends BaseDocument {
  quoteNumber: string;
  validUntil: Date | string;
  status: QuotationStatus;
}

export interface ProformaInvoice extends BaseDocument {
  proformaNumber: string;
  quotationRef?: any;
  validUntil: Date | string;
  status: ProformaStatus;
}

export interface FinalInvoice extends BaseDocument {
  invoiceNumber: string;
  proformaRef?: any;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentDate?: Date | string;
}
