import express from 'express';
import {
  getNextInvoiceNumber,
  listInvoices,
  getInvoiceById,
  createInvoice,
  cancelInvoice,
} from '../controllers/invoiceController.js';
import { validateInvoiceBody } from '../middleware/validate.js';

export const invoiceRouter = express.Router();

invoiceRouter.get('/next-number', getNextInvoiceNumber);
invoiceRouter.get('/', listInvoices);
invoiceRouter.get('/:id', getInvoiceById);
invoiceRouter.post('/', validateInvoiceBody, createInvoice);
invoiceRouter.post('/:id/cancel', cancelInvoice);
