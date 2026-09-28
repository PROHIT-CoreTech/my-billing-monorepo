import { z } from 'zod';
export declare const clientSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    billingAddress: z.ZodString;
    taxId: z.ZodString;
    gstin: z.ZodOptional<z.ZodString>;
    pan: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    billingAddress: string;
    taxId: string;
    gstin?: string | undefined;
    pan?: string | undefined;
}, {
    name: string;
    email: string;
    billingAddress: string;
    taxId: string;
    gstin?: string | undefined;
    pan?: string | undefined;
}>;
export declare const clientInfoSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    billingAddress: z.ZodString;
    taxId: z.ZodString;
    gstin: z.ZodOptional<z.ZodString>;
    pan: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    billingAddress: string;
    taxId: string;
    gstin?: string | undefined;
    pan?: string | undefined;
}, {
    name: string;
    email: string;
    billingAddress: string;
    taxId: string;
    gstin?: string | undefined;
    pan?: string | undefined;
}>;
export declare const lineItemSchema: z.ZodObject<{
    description: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    price: z.ZodNumber;
    taxRate: z.ZodDefault<z.ZodNumber>;
    hsnSac: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    discountPercent: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    taxAmount: z.ZodDefault<z.ZodNumber>;
    total: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    price: number;
    taxRate: number;
    hsnSac: string;
    discountPercent: number;
    taxAmount: number;
    total: number;
    quantity?: number | undefined;
}, {
    description: string;
    price: number;
    quantity?: number | undefined;
    taxRate?: number | undefined;
    hsnSac?: string | undefined;
    discountPercent?: number | undefined;
    taxAmount?: number | undefined;
    total?: number | undefined;
}>;
export declare const invoiceSchema: z.ZodObject<{
    documentType: z.ZodEnum<["QUOTATION", "PROFORMA", "FINAL_INVOICE"]>;
    documentNumber: z.ZodString;
    clientRef: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>]>, string, string | Record<string, any>>;
    clientInfo: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        billingAddress: z.ZodString;
        taxId: z.ZodString;
        gstin: z.ZodOptional<z.ZodString>;
        pan: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        billingAddress: string;
        taxId: string;
        gstin?: string | undefined;
        pan?: string | undefined;
    }, {
        name: string;
        email: string;
        billingAddress: string;
        taxId: string;
        gstin?: string | undefined;
        pan?: string | undefined;
    }>;
    items: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
        hsnSac: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        discountPercent: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        taxAmount: z.ZodDefault<z.ZodNumber>;
        total: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        price: number;
        taxRate: number;
        hsnSac: string;
        discountPercent: number;
        taxAmount: number;
        total: number;
        quantity?: number | undefined;
    }, {
        description: string;
        price: number;
        quantity?: number | undefined;
        taxRate?: number | undefined;
        hsnSac?: string | undefined;
        discountPercent?: number | undefined;
        taxAmount?: number | undefined;
        total?: number | undefined;
    }>, "many">;
    subTotal: z.ZodDefault<z.ZodNumber>;
    taxAmount: z.ZodDefault<z.ZodNumber>;
    totalAmount: z.ZodDefault<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodDefault<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    dueDate: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    status: z.ZodDefault<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    quotationRef: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodNull]>>, any, string | Record<string, any> | null | undefined>;
    proformaRef: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodNull]>>, any, string | Record<string, any> | null | undefined>;
    validUntil: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    paymentStatus: z.ZodOptional<z.ZodEnum<["UNPAID", "PARTIALLY_PAID", "PAID"]>>;
    paymentDate: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    status: string;
    taxAmount: number;
    documentType: "QUOTATION" | "PROFORMA" | "FINAL_INVOICE";
    documentNumber: string;
    clientRef: string;
    clientInfo: {
        name: string;
        email: string;
        billingAddress: string;
        taxId: string;
        gstin?: string | undefined;
        pan?: string | undefined;
    };
    items: {
        description: string;
        price: number;
        taxRate: number;
        hsnSac: string;
        discountPercent: number;
        taxAmount: number;
        total: number;
        quantity?: number | undefined;
    }[];
    subTotal: number;
    totalAmount: number;
    currency: string;
    issueDate: string | Date;
    notes?: string | undefined;
    dueDate?: string | Date | undefined;
    logoUrl?: string | undefined;
    quotationRef?: any;
    proformaRef?: any;
    validUntil?: string | Date | undefined;
    paymentStatus?: "PAID" | "UNPAID" | "PARTIALLY_PAID" | undefined;
    paymentDate?: string | Date | undefined;
}, {
    documentType: "QUOTATION" | "PROFORMA" | "FINAL_INVOICE";
    documentNumber: string;
    clientRef: string | Record<string, any>;
    clientInfo: {
        name: string;
        email: string;
        billingAddress: string;
        taxId: string;
        gstin?: string | undefined;
        pan?: string | undefined;
    };
    items: {
        description: string;
        price: number;
        quantity?: number | undefined;
        taxRate?: number | undefined;
        hsnSac?: string | undefined;
        discountPercent?: number | undefined;
        taxAmount?: number | undefined;
        total?: number | undefined;
    }[];
    status?: string | undefined;
    taxAmount?: number | undefined;
    subTotal?: number | undefined;
    totalAmount?: number | undefined;
    currency?: string | undefined;
    notes?: string | undefined;
    issueDate?: string | Date | undefined;
    dueDate?: string | Date | undefined;
    logoUrl?: string | undefined;
    quotationRef?: string | Record<string, any> | null | undefined;
    proformaRef?: string | Record<string, any> | null | undefined;
    validUntil?: string | Date | undefined;
    paymentStatus?: "PAID" | "UNPAID" | "PARTIALLY_PAID" | undefined;
    paymentDate?: string | Date | undefined;
}>;
//# sourceMappingURL=validation.d.ts.map