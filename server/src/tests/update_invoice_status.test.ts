import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type UpdateInvoiceStatusInput, type CreateInvoiceInput } from '../schema';
import { updateInvoiceStatus } from '../handlers/update_invoice_status';
import { eq } from 'drizzle-orm';

// Test invoice data
const testInvoiceData: CreateInvoiceInput = {
  invoice_number: 'INV-001',
  client_name: 'Test Client',
  date_issued: new Date('2023-01-01'),
  amount_due: 1000.50,
  status: 'Pending',
  description: 'Test invoice description'
};

describe('updateInvoiceStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update invoice status from Pending to Paid', async () => {
    // Create test invoice first
    const createdInvoice = await db.insert(invoicesTable)
      .values({
        invoice_number: testInvoiceData.invoice_number,
        client_name: testInvoiceData.client_name,
        date_issued: testInvoiceData.date_issued,
        amount_due: testInvoiceData.amount_due.toString(),
        status: testInvoiceData.status,
        description: testInvoiceData.description
      })
      .returning()
      .execute();

    const invoiceId = createdInvoice[0].id;

    // Update status to Paid
    const updateInput: UpdateInvoiceStatusInput = {
      id: invoiceId,
      status: 'Paid'
    };

    const result = await updateInvoiceStatus(updateInput);

    // Verify result
    expect(result.id).toBe(invoiceId);
    expect(result.status).toBe('Paid');
    expect(result.invoice_number).toBe('INV-001');
    expect(result.client_name).toBe('Test Client');
    expect(result.amount_due).toBe(1000.50);
    expect(typeof result.amount_due).toBe('number');
    expect(result.description).toBe('Test invoice description');
    expect(result.date_issued).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update invoice status from Paid to Pending', async () => {
    // Create test invoice with Paid status
    const createdInvoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        client_name: 'Another Client',
        date_issued: new Date('2023-02-01'),
        amount_due: '500.25',
        status: 'Paid',
        description: 'Paid invoice'
      })
      .returning()
      .execute();

    const invoiceId = createdInvoice[0].id;

    // Update status back to Pending
    const updateInput: UpdateInvoiceStatusInput = {
      id: invoiceId,
      status: 'Pending'
    };

    const result = await updateInvoiceStatus(updateInput);

    // Verify result
    expect(result.id).toBe(invoiceId);
    expect(result.status).toBe('Pending');
    expect(result.invoice_number).toBe('INV-002');
    expect(result.client_name).toBe('Another Client');
    expect(result.amount_due).toBe(500.25);
    expect(typeof result.amount_due).toBe('number');
  });

  it('should persist status change in database', async () => {
    // Create test invoice
    const createdInvoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-003',
        client_name: 'Database Test Client',
        date_issued: new Date('2023-03-01'),
        amount_due: '750.00',
        status: 'Pending',
        description: 'Database persistence test'
      })
      .returning()
      .execute();

    const invoiceId = createdInvoice[0].id;

    // Update status
    await updateInvoiceStatus({
      id: invoiceId,
      status: 'Paid'
    });

    // Verify change was persisted in database
    const updatedInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(updatedInvoice).toHaveLength(1);
    expect(updatedInvoice[0].status).toBe('Paid');
    expect(updatedInvoice[0].invoice_number).toBe('INV-003');
    expect(parseFloat(updatedInvoice[0].amount_due)).toBe(750.00);
  });

  it('should throw error when invoice does not exist', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateInvoiceStatusInput = {
      id: nonExistentId,
      status: 'Paid'
    };

    await expect(updateInvoiceStatus(updateInput))
      .rejects
      .toThrow(/Invoice with id 99999 not found/i);
  });

  it('should handle invoices with different amounts correctly', async () => {
    // Create invoice with decimal amount
    const createdInvoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-004',
        client_name: 'Decimal Test Client',
        date_issued: new Date('2023-04-01'),
        amount_due: '1234.56',
        status: 'Pending',
        description: 'Decimal amount test'
      })
      .returning()
      .execute();

    const invoiceId = createdInvoice[0].id;

    const result = await updateInvoiceStatus({
      id: invoiceId,
      status: 'Paid'
    });

    // Verify numeric conversion works correctly
    expect(result.amount_due).toBe(1234.56);
    expect(typeof result.amount_due).toBe('number');
    expect(result.status).toBe('Paid');
  });

  it('should preserve all original invoice data except status', async () => {
    const originalDate = new Date('2023-05-15T10:30:00Z');
    
    // Create invoice with specific data
    const createdInvoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-PRESERVE-001',
        client_name: 'Data Preservation Client',
        date_issued: originalDate,
        amount_due: '999.99',
        status: 'Pending',
        description: 'Long description with special characters: !@#$%^&*()'
      })
      .returning()
      .execute();

    const invoiceId = createdInvoice[0].id;
    const originalCreatedAt = createdInvoice[0].created_at;

    // Update only the status
    const result = await updateInvoiceStatus({
      id: invoiceId,
      status: 'Paid'
    });

    // Verify all original data is preserved except status
    expect(result.id).toBe(invoiceId);
    expect(result.invoice_number).toBe('INV-PRESERVE-001');
    expect(result.client_name).toBe('Data Preservation Client');
    expect(result.date_issued).toEqual(originalDate);
    expect(result.amount_due).toBe(999.99);
    expect(result.description).toBe('Long description with special characters: !@#$%^&*()');
    expect(result.created_at).toEqual(originalCreatedAt);
    // Only status should be changed
    expect(result.status).toBe('Paid');
  });
});