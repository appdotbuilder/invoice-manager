import { z } from 'zod';

// Invoice status enum
export const invoiceStatusEnum = z.enum(['Pending', 'Paid']);
export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;

// Invoice schema
export const invoiceSchema = z.object({
  id: z.number(),
  invoice_number: z.string(),
  client_name: z.string(),
  date_issued: z.coerce.date(),
  amount_due: z.number(),
  status: invoiceStatusEnum,
  description: z.string(),
  created_at: z.coerce.date()
});

export type Invoice = z.infer<typeof invoiceSchema>;

// Input schema for creating invoices
export const createInvoiceInputSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  client_name: z.string().min(1, 'Client name is required'),
  date_issued: z.coerce.date(),
  amount_due: z.number().positive('Amount due must be positive'),
  status: invoiceStatusEnum.default('Pending'),
  description: z.string().min(1, 'Description is required')
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

// Input schema for updating invoice status
export const updateInvoiceStatusInputSchema = z.object({
  id: z.number(),
  status: invoiceStatusEnum
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusInputSchema>;