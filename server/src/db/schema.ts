import { serial, text, pgTable, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Define invoice status enum for database
export const invoiceStatusEnum = pgEnum('invoice_status', ['Pending', 'Paid']);

export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: text('invoice_number').notNull().unique(), // Unique constraint for invoice numbers
  client_name: text('client_name').notNull(),
  date_issued: timestamp('date_issued').notNull(),
  amount_due: numeric('amount_due', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values with precision
  status: invoiceStatusEnum('status').notNull().default('Pending'),
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Invoice = typeof invoicesTable.$inferSelect; // For SELECT operations
export type NewInvoice = typeof invoicesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { invoices: invoicesTable };