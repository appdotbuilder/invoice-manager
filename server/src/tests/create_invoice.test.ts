import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type CreateInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateInvoiceInput = {
  invoice_number: 'INV-2024-001',
  client_name: 'Test Client Corp',
  date_issued: new Date('2024-01-15'),
  amount_due: 1250.75,
  status: 'Pending' as const,
  description: 'Software development services for Q1 2024'
};

describe('createInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an invoice with all fields', async () => {
    const result = await createInvoice(testInput);

    // Validate all returned fields
    expect(result.invoice_number).toEqual('INV-2024-001');
    expect(result.client_name).toEqual('Test Client Corp');
    expect(result.date_issued).toEqual(new Date('2024-01-15'));
    expect(result.amount_due).toEqual(1250.75);
    expect(typeof result.amount_due).toEqual('number'); // Verify numeric conversion
    expect(result.status).toEqual('Pending');
    expect(result.description).toEqual('Software development services for Q1 2024');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save invoice to database correctly', async () => {
    const result = await createInvoice(testInput);

    // Query the database to verify persistence
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices).toHaveLength(1);
    const savedInvoice = invoices[0];
    
    expect(savedInvoice.invoice_number).toEqual('INV-2024-001');
    expect(savedInvoice.client_name).toEqual('Test Client Corp');
    expect(savedInvoice.date_issued).toEqual(new Date('2024-01-15'));
    expect(parseFloat(savedInvoice.amount_due)).toEqual(1250.75); // Verify numeric storage
    expect(savedInvoice.status).toEqual('Pending');
    expect(savedInvoice.description).toEqual('Software development services for Q1 2024');
    expect(savedInvoice.created_at).toBeInstanceOf(Date);
  });

  it('should create invoice with Paid status', async () => {
    const paidInvoiceInput: CreateInvoiceInput = {
      ...testInput,
      invoice_number: 'INV-2024-002',
      status: 'Paid' as const
    };

    const result = await createInvoice(paidInvoiceInput);

    expect(result.status).toEqual('Paid');
    expect(result.invoice_number).toEqual('INV-2024-002');
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: CreateInvoiceInput = {
      ...testInput,
      invoice_number: 'INV-2024-003',
      amount_due: 999.99
    };

    const result = await createInvoice(decimalInput);

    expect(result.amount_due).toEqual(999.99);
    expect(typeof result.amount_due).toEqual('number');

    // Verify database storage precision
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(parseFloat(invoices[0].amount_due)).toEqual(999.99);
  });

  it('should reject duplicate invoice numbers', async () => {
    // Create first invoice
    await createInvoice(testInput);

    // Attempt to create invoice with same number
    const duplicateInput: CreateInvoiceInput = {
      ...testInput,
      client_name: 'Different Client'
    };

    await expect(createInvoice(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle large amounts correctly', async () => {
    const largeAmountInput: CreateInvoiceInput = {
      ...testInput,
      invoice_number: 'INV-2024-004',
      amount_due: 99999999.99 // Test precision limits
    };

    const result = await createInvoice(largeAmountInput);

    expect(result.amount_due).toEqual(99999999.99);
    expect(typeof result.amount_due).toEqual('number');
  });

  it('should create multiple invoices successfully', async () => {
    const invoice1Input: CreateInvoiceInput = {
      ...testInput,
      invoice_number: 'INV-2024-005'
    };

    const invoice2Input: CreateInvoiceInput = {
      ...testInput,
      invoice_number: 'INV-2024-006',
      client_name: 'Another Client',
      amount_due: 500.00
    };

    const result1 = await createInvoice(invoice1Input);
    const result2 = await createInvoice(invoice2Input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.invoice_number).toEqual('INV-2024-005');
    expect(result2.invoice_number).toEqual('INV-2024-006');
    expect(result2.amount_due).toEqual(500.00);

    // Verify both are in database
    const allInvoices = await db.select()
      .from(invoicesTable)
      .execute();

    expect(allInvoices).toHaveLength(2);
  });
});