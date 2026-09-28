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
    quantity?: number;
    price: number;
    taxRate: number;
    hsnSac?: string;
    discountPercent?: number;
    taxAmount?: number;
    total?: number;
}
export interface BaseDocument {
    id?: string;
    clientRef: any;
    clientInfo: Omit<Client, 'id'>;
    items: LineItem[];
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    notes?: string;
    issueDate: Date | string;
    dueDate?: Date | string;
    logoUrl?: string;
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
    quotationRef?: any;
    proformaRef?: any;
    validUntil?: Date | string;
    paymentStatus?: PaymentStatus;
    paymentDate?: Date | string;
}
export interface Quotation extends Invoice {
    documentType: 'QUOTATION';
    quoteNumber: string;
    validUntil: Date | string;
    status: QuotationStatus;
}
export interface ProformaInvoice extends Invoice {
    documentType: 'PROFORMA';
    proformaNumber: string;
    quotationRef?: any;
    validUntil: Date | string;
    status: ProformaStatus;
}
export interface FinalInvoice extends Invoice {
    documentType: 'FINAL_INVOICE';
    invoiceNumber: string;
    proformaRef?: any;
    status: InvoiceStatus;
    paymentStatus: PaymentStatus;
    paymentDate?: Date | string;
}
//# sourceMappingURL=types.d.ts.map