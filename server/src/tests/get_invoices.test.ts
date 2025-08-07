import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type CreateInvoiceInput } from '../schema';
import { getInvoices } from '../handlers/get_invoices';

// Test data for multiple invoices
const testInvoice1: CreateInvoiceInput = {
  invoice_number: 'INV-2024-001',
  client_name: 'Client A',
  date_issued: new Date('2024-01-15'),
  amount_due: 100.50,
  status: 'Pending',
  description: 'Web development services'
};

const testInvoice2: CreateInvoiceInput = {
  invoice_number: 'INV-2024-002',
  client_name: 'Client B',
  date_issued: new Date('2024-01-20'),
  amount_due: 250.00,
  status: 'Paid',
  description: 'Design consultation'
};

const testInvoice3: CreateInvoiceInput = {
  invoice_number: 'INV-2024-003',
  client_name: 'Client C',
  date_issued: new Date('2024-01-10'),
  amount_due: 75.25,
  status: 'Pending',
  description: 'Code review'
};

describe('getInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no invoices exist', async () => {
    const result = await getInvoices();
    
    expect(result).toEqual([]);
  });

  it('should return all invoices with correct data types', async () => {
    // Insert test invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: testInvoice1.invoice_number,
        client_name: testInvoice1.client_name,
        date_issued: testInvoice1.date_issued,
        amount_due: testInvoice1.amount_due.toString(), // Convert to string for database
        status: testInvoice1.status,
        description: testInvoice1.description
      })
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(1);
    
    const invoice = result[0];
    expect(invoice.invoice_number).toEqual('INV-2024-001');
    expect(invoice.client_name).toEqual('Client A');
    expect(invoice.date_issued).toBeInstanceOf(Date);
    expect(typeof invoice.amount_due).toBe('number'); // Should be converted back to number
    expect(invoice.amount_due).toEqual(100.50);
    expect(invoice.status).toEqual('Pending');
    expect(invoice.description).toEqual('Web development services');
    expect(invoice.id).toBeDefined();
    expect(invoice.created_at).toBeInstanceOf(Date);
  });

  it('should return invoices ordered by creation date (newest first)', async () => {
    // Insert invoices with different creation times
    // First invoice (will be created first)
    await db.insert(invoicesTable)
      .values({
        invoice_number: testInvoice1.invoice_number,
        client_name: testInvoice1.client_name,
        date_issued: testInvoice1.date_issued,
        amount_due: testInvoice1.amount_due.toString(),
        status: testInvoice1.status,
        description: testInvoice1.description
      })
      .execute();

    // Add small delay to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 10));

    // Second invoice (will be created second)
    await db.insert(invoicesTable)
      .values({
        invoice_number: testInvoice2.invoice_number,
        client_name: testInvoice2.client_name,
        date_issued: testInvoice2.date_issued,
        amount_due: testInvoice2.amount_due.toString(),
        status: testInvoice2.status,
        description: testInvoice2.description
      })
      .execute();

    // Add small delay to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 10));

    // Third invoice (will be created last)
    await db.insert(invoicesTable)
      .values({
        invoice_number: testInvoice3.invoice_number,
        client_name: testInvoice3.client_name,
        date_issued: testInvoice3.date_issued,
        amount_due: testInvoice3.amount_due.toString(),
        status: testInvoice3.status,
        description: testInvoice3.description
      })
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(3);
    
    // Should be ordered by creation date (newest first)
    // The last created invoice should be first in results
    expect(result[0].invoice_number).toEqual('INV-2024-003');
    expect(result[1].invoice_number).toEqual('INV-2024-002');
    expect(result[2].invoice_number).toEqual('INV-2024-001');
    
    // Verify creation times are in descending order
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThanOrEqual(result[2].created_at.getTime());
  });

  it('should handle different invoice statuses correctly', async () => {
    // Insert invoices with different statuses
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: testInvoice1.invoice_number,
          client_name: testInvoice1.client_name,
          date_issued: testInvoice1.date_issued,
          amount_due: testInvoice1.amount_due.toString(),
          status: 'Pending',
          description: testInvoice1.description
        },
        {
          invoice_number: testInvoice2.invoice_number,
          client_name: testInvoice2.client_name,
          date_issued: testInvoice2.date_issued,
          amount_due: testInvoice2.amount_due.toString(),
          status: 'Paid',
          description: testInvoice2.description
        }
      ])
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(2);
    
    // Find invoices by their unique invoice numbers
    const pendingInvoice = result.find(inv => inv.invoice_number === 'INV-2024-001');
    const paidInvoice = result.find(inv => inv.invoice_number === 'INV-2024-002');
    
    expect(pendingInvoice).toBeDefined();
    expect(pendingInvoice!.status).toEqual('Pending');
    
    expect(paidInvoice).toBeDefined();
    expect(paidInvoice!.status).toEqual('Paid');
  });

  it('should handle various amount values correctly', async () => {
    // Insert invoices with different amount formats
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-AMOUNT-001',
          client_name: 'Test Client',
          date_issued: new Date(),
          amount_due: '99.99', // Two decimal places
          status: 'Pending',
          description: 'Test invoice'
        },
        {
          invoice_number: 'INV-AMOUNT-002',
          client_name: 'Test Client',
          date_issued: new Date(),
          amount_due: '100.00', // Whole number with decimals
          status: 'Pending',
          description: 'Test invoice'
        },
        {
          invoice_number: 'INV-AMOUNT-003',
          client_name: 'Test Client',
          date_issued: new Date(),
          amount_due: '0.50', // Less than one dollar
          status: 'Pending',
          description: 'Test invoice'
        }
      ])
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(3);
    
    // Verify all amounts are properly converted to numbers
    result.forEach(invoice => {
      expect(typeof invoice.amount_due).toBe('number');
      expect(invoice.amount_due).toBeGreaterThan(0);
    });

    // Find specific invoices and check amounts
    const invoice1 = result.find(inv => inv.invoice_number === 'INV-AMOUNT-001');
    const invoice2 = result.find(inv => inv.invoice_number === 'INV-AMOUNT-002');
    const invoice3 = result.find(inv => inv.invoice_number === 'INV-AMOUNT-003');

    expect(invoice1!.amount_due).toEqual(99.99);
    expect(invoice2!.amount_due).toEqual(100.00);
    expect(invoice3!.amount_due).toEqual(0.50);
  });
});