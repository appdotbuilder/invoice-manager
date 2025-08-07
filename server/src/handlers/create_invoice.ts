import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type CreateInvoiceInput, type Invoice } from '../schema';

export const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice> => {
  try {
    // Insert invoice record
    const result = await db.insert(invoicesTable)
      .values({
        invoice_number: input.invoice_number,
        client_name: input.client_name,
        date_issued: input.date_issued,
        amount_due: input.amount_due.toString(), // Convert number to string for numeric column
        status: input.status,
        description: input.description
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const invoice = result[0];
    return {
      ...invoice,
      amount_due: parseFloat(invoice.amount_due) // Convert string back to number
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    throw error;
  }
};