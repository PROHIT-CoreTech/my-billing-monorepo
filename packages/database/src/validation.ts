import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  billingAddress: z.string().min(1, 'Billing address is required'),
  taxId: z.string().min(1, 'Tax ID is required'),
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

export const clientInfoSchema = clientSchema; // Same shape, used for embedded snapshot validation

export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  price: z.number().nonnegative('Price must be greater than or equal to 0'),
  taxRate: z.number().nonnegative('Tax rate must be greater than or equal to 0').default(0),
  hsnSac: z.string().optional().default('998311'),
  taxAmount: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
});

export const invoiceSchema = z.object({
  documentType: z.enum(['QUOTATION', 'PROFORMA', 'FINAL_INVOICE']),
  documentNumber: z.string().min(1, 'Document number is required'),
  clientRef: z.string().min(1, 'Client ID reference is required'),
  clientInfo: clientInfoSchema,
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
  subTotal: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative().default(0),
  currency: z.string().min(1, 'Currency is required').default('INR'),
  notes: z.string().optional(),
  issueDate: z.union([z.date(), z.string()]).default(() => new Date()),
  dueDate: z.union([z.date(), z.string()]).optional(),
  status: z.string().default('DRAFT'),
  
  // Tracing references
  quotationRef: z.string().optional(),
  proformaRef: z.string().optional(),
  
  // Optional parameters based on documentType
  validUntil: z.union([z.date(), z.string()]).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']).optional(),
  paymentDate: z.union([z.date(), z.string()]).optional(),
});
