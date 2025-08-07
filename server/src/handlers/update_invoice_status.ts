import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type UpdateInvoiceStatusInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInvoiceStatus = async (input: UpdateInvoiceStatusInput): Promise<Invoice> => {
  try {
    // Update the invoice status
    const result = await db.update(invoicesTable)
      .set({
        status: input.status
      })
      .where(eq(invoicesTable.id, input.id))
      .returning()
      .execute();

    // Check if invoice was found and updated
    if (result.length === 0) {
      throw new Error(`Invoice with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const invoice = result[0];
    return {
      ...invoice,
      amount_due: parseFloat(invoice.amount_due) // Convert string back to number
    };
  } catch (error) {
    console.error('Invoice status update failed:', error);
    throw error;
  }
};