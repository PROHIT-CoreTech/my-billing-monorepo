import { z } from 'zod';
const stringOrRefObject = z.union([z.string(), z.record(z.any()), z.null()]).optional().transform((val) => {
    if (!val)
        return undefined;
    if (typeof val === 'string')
        return val.trim() || undefined;
    if (typeof val === 'object')
        return val.id || val._id || val.toString() || undefined;
    return undefined;
});
const requiredStringOrRefObject = z.union([z.string(), z.record(z.any())]).transform((val, ctx) => {
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Client ID reference is required' });
            return z.NEVER;
        }
        return trimmed;
    }
    if (typeof val === 'object' && val !== null) {
        const extracted = val.id || val._id || val.toString();
        if (extracted)
            return String(extracted);
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Client ID reference is required' });
    return z.NEVER;
});
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
    quantity: z.number().nonnegative('Quantity must be greater than or equal to 0').optional(),
    price: z.number().nonnegative('Price must be greater than or equal to 0'),
    taxRate: z.number().nonnegative('Tax rate must be greater than or equal to 0').default(0),
    hsnSac: z.string().optional().default('998311'),
    discountPercent: z.number().nonnegative('Discount percent must be greater than or equal to 0').optional().default(0),
    taxAmount: z.number().nonnegative().default(0),
    total: z.number().nonnegative().default(0),
});
export const invoiceSchema = z.object({
    documentType: z.enum(['QUOTATION', 'PROFORMA', 'FINAL_INVOICE']),
    documentNumber: z.string().min(1, 'Document number is required'),
    clientRef: requiredStringOrRefObject,
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
    logoUrl: z.string().optional(),
    // Tracing references
    quotationRef: stringOrRefObject,
    proformaRef: stringOrRefObject,
    // Optional parameters based on documentType
    validUntil: z.union([z.date(), z.string()]).optional(),
    paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']).optional(),
    paymentDate: z.union([z.date(), z.string()]).optional(),
});
//# sourceMappingURL=validation.js.map