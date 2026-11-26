import { getElectronAPI, restRequest } from './apiClient';
import { Invoice } from '../types';

export interface InvoiceFilter {
  search?: string;
  customerId?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface CreateInvoiceInput {
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  customerGstin?: string;
  invoiceDate: string;
  isInterstate: boolean;
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    hsnCode?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    taxableValue: number;
    gstRate: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  roundOff: number;
  amountReceived: number;
  balanceDue: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
}

export const invoiceApi = {
  // Get auto-incremented invoice number
  async getNextInvoiceNumber(): Promise<string> {
    const electron = getElectronAPI();
    if (electron) {
      try {
        const num = await electron.getNextInvoiceNumber();
        if (num && typeof num === 'string' && num.trim() !== '' && num !== 'Loading...') {
          localStorage.setItem('vnd_last_known_invoice_number', num.trim());
          return num.trim();
        }
      } catch (err) {
        console.error('[invoiceApi] Error fetching invoice number from electron:', err);
      }
    }

    try {
      const res = await restRequest<any>('/invoices/next-number');
      const num = res?.nextNumber || res?.data?.nextNumber;
      if (num && typeof num === 'string' && num.trim() !== '') {
        localStorage.setItem('vnd_last_known_invoice_number', num.trim());
        return num.trim();
      }
    } catch (err) {
      console.warn('[invoiceApi] REST getNextInvoiceNumber unavailable, falling back:', err);
    }

    // Guaranteed local fallback
    const cached = localStorage.getItem('vnd_last_known_invoice_number');
    if (cached && cached.trim() !== '' && cached !== 'Loading...') {
      const match = cached.match(/(\d+)$/);
      if (match) {
        const nextVal = parseInt(match[1], 10) + 1;
        const prefix = cached.slice(0, match.index);
        const nextStr = `${prefix}${nextVal}`;
        localStorage.setItem('vnd_last_known_invoice_number', nextStr);
        return nextStr;
      }
      return cached;
    }

    const fallback = 'VND-1004';
    localStorage.setItem('vnd_last_known_invoice_number', fallback);
    return fallback;
  },

  // List invoices with filters
  async getInvoices(filter?: InvoiceFilter): Promise<Invoice[]> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getInvoices(filter);
    }
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.paymentStatus) params.append('paymentStatus', filter.paymentStatus);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await restRequest<Invoice[]>(`/invoices${query}`);
  },

  // Get invoice by ID
  async getInvoiceById(id: string): Promise<Invoice | null> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getInvoiceById(id);
    }
    return await restRequest<Invoice>(`/invoices/${id}`);
  },

  // Create new invoice
  async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.createInvoice(input);
    }
    return await restRequest<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Cancel invoice with audit trail and stock restock
  async cancelInvoice(id: string, reason: string): Promise<boolean> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.cancelInvoice(id, reason);
    }
    await restRequest(`/invoices/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return true;
  },
};
