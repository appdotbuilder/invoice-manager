import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Invoice, CreateInvoiceInput, InvoiceStatus } from '../../server/src/schema';

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<CreateInvoiceInput>({
    invoice_number: '',
    client_name: '',
    date_issued: new Date(),
    amount_due: 0,
    status: 'Pending' as InvoiceStatus,
    description: ''
  });

  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getInvoices.query();
      setInvoices(result);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await trpc.createInvoice.mutate(formData);
      setInvoices((prev: Invoice[]) => [response, ...prev]);
      // Reset form
      setFormData({
        invoice_number: '',
        client_name: '',
        date_issued: new Date(),
        amount_due: 0,
        status: 'Pending' as InvoiceStatus,
        description: ''
      });
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (invoiceId: number, newStatus: InvoiceStatus) => {
    try {
      const updatedInvoice = await trpc.updateInvoiceStatus.mutate({
        id: invoiceId,
        status: newStatus
      });
      
      setInvoices((prev: Invoice[]) => 
        prev.map((invoice: Invoice) => 
          invoice.id === invoiceId ? updatedInvoice : invoice
        )
      );
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    return status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📄 Invoice Manager
          </h1>
          <p className="text-gray-600">
            Manage your software consulting invoices with ease
          </p>
        </div>

        {/* Create Invoice Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              ✨ Create New Invoice
            </CardTitle>
            <CardDescription className="text-blue-100">
              Add a new invoice for your consulting services
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  placeholder="e.g., INV-2024-001"
                  value={formData.invoice_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInvoiceInput) => ({ ...prev, invoice_number: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  placeholder="e.g., Acme Corp"
                  value={formData.client_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInvoiceInput) => ({ ...prev, client_name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_issued">Date Issued</Label>
                <Input
                  id="date_issued"
                  type="date"
                  value={formData.date_issued.toISOString().split('T')[0]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInvoiceInput) => ({ 
                      ...prev, 
                      date_issued: new Date(e.target.value) 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount_due">Amount Due ($)</Label>
                <Input
                  id="amount_due"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount_due}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateInvoiceInput) => ({ 
                      ...prev, 
                      amount_due: parseFloat(e.target.value) || 0 
                    }))
                  }
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description of Services</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the consulting services provided..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateInvoiceInput) => ({ ...prev, description: e.target.value }))
                  }
                  required
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? 'Creating Invoice...' : '✨ Create Invoice'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Invoice List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📋 Invoice List</h2>
            <Button
              onClick={loadInvoices}
              disabled={isLoading}
              variant="outline"
              className="bg-white"
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh'}
            </Button>
          </div>

          {isLoading && invoices.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="animate-pulse">Loading invoices...</div>
            </Card>
          ) : invoices.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-2">📭 No invoices yet</div>
              <p className="text-sm text-gray-400">Create your first invoice above!</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invoices.map((invoice: Invoice) => (
                <Card key={invoice.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {invoice.invoice_number}
                          </h3>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status === 'Paid' ? '✅' : '⏳'} {invoice.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Client:</span>
                            <p className="text-gray-800">{invoice.client_name}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Date Issued:</span>
                            <p className="text-gray-800">{invoice.date_issued.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Amount Due:</span>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(invoice.amount_due)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className="font-medium text-gray-600">Services:</span>
                          <p className="text-gray-700 mt-1">{invoice.description}</p>
                        </div>

                        <p className="text-xs text-gray-400 mt-3">
                          Created: {invoice.created_at.toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 lg:ml-4">
                        <Label className="text-sm font-medium">Update Status:</Label>
                        <Select
                          value={invoice.status}
                          onValueChange={(value: InvoiceStatus) => 
                            handleStatusUpdate(invoice.id, value)
                          }
                        >
                          <SelectTrigger className="w-full lg:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">⏳ Pending</SelectItem>
                            <SelectItem value="Paid">✅ Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          💼 Professional Invoice Management System
        </div>
      </div>
    </div>
  );
}

export default App;