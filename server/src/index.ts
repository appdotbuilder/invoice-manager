import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { createInvoiceInputSchema, updateInvoiceStatusInputSchema } from './schema';
import { createInvoice } from './handlers/create_invoice';
import { getInvoices } from './handlers/get_invoices';
import { updateInvoiceStatus } from './handlers/update_invoice_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new invoice
  createInvoice: publicProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  
  // Get all invoices
  getInvoices: publicProcedure
    .query(() => getInvoices()),
  
  // Update invoice status
  updateInvoiceStatus: publicProcedure
    .input(updateInvoiceStatusInputSchema)
    .mutation(({ input }) => updateInvoiceStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Invoice Management TRPC server listening at port: ${port}`);
}

start();