import { ipcMain, app, shell, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import Database from 'better-sqlite3';
import { getDashboardMetrics } from '../database/repositories/dashboardRepo';
import { getDatabasePath } from '../database/db';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  ProductFilter,
  ProductInput,
} from '../database/repositories/productRepo';
import {
  adjustStock,
  getStockMovements,
  getInventorySummary,
  StockAdjustmentInput,
} from '../database/repositories/inventoryRepo';
import {
  getNextInvoiceNumber,
  createInvoice,
  cancelInvoice,
  listInvoices,
  getInvoiceById,
  CreateInvoiceInput,
  InvoiceFilter,
} from '../database/repositories/invoiceRepo';
import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  logWhatsAppMessage,
  getWhatsAppLogs,
  CustomerFilter,
  CustomerInput,
} from '../database/repositories/customerRepo';
import {
  getInstalledPrinters,
  printHtml,
  exportToPdfFile,
  PrintOptions,
} from '../services/printService';
import {
  getSyncStatus,
  loginCloud,
  triggerSync,
  requestCloudBackup,
} from '../services/syncService';
import {
  getSalesReportSummary,
  generateInvoicesCSV,
  generateTaxReportCSV,
  ReportFilter,
} from '../database/repositories/reportsRepo';

export function registerIpcHandlers(db: Database.Database) {
  // App & System info
  ipcMain.handle('app:ping', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  ipcMain.handle('app:getInfo', async () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      databasePath: getDatabasePath(),
      isPackaged: app.isPackaged,
      platform: process.platform,
    };
  });

  // Business Info & Settings
  ipcMain.handle('business:getInfo', async () => {
    const biz = db.prepare(`
      SELECT b.*, s.invoice_prefix, s.invoice_counter, s.default_gst_rate, s.default_payment_method, s.paper_size, s.default_printer, s.invoice_footer, s.terms_and_conditions
      FROM businesses b
      LEFT JOIN business_settings s ON b.id = s.business_id
      LIMIT 1
    `).get();
    return biz;
  });

  ipcMain.handle('settings:savePrinter', async (_, input: { paperSize: string; defaultPrinter?: string }) => {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE business_settings
      SET paper_size = ?, default_printer = ?, updated_at = ?
      WHERE business_id = 'biz_default_001'
    `).run(input.paperSize, input.defaultPrinter || null, now);
    return { success: true };
  });

  // Dashboard Metrics
  ipcMain.handle('dashboard:getMetrics', async () => {
    try {
      return getDashboardMetrics(db);
    } catch (err: any) {
      console.error('[IPC] Error in dashboard:getMetrics:', err);
      throw err;
    }
  });

  // Product CRUD
  ipcMain.handle('products:list', async (_, filter?: ProductFilter) => {
    try {
      return listProducts(db, filter);
    } catch (err: any) {
      console.error('[IPC] Error in products:list:', err);
      throw err;
    }
  });

  ipcMain.handle('products:getById', async (_, id: string) => {
    try {
      return getProductById(db, id);
    } catch (err: any) {
      console.error('[IPC] Error in products:getById:', err);
      throw err;
    }
  });

  ipcMain.handle('products:create', async (_, input: ProductInput) => {
    try {
      return createProduct(db, input);
    } catch (err: any) {
      console.error('[IPC] Error in products:create:', err);
      throw new Error(err.message || 'Failed to create product');
    }
  });

  ipcMain.handle('products:update', async (_, id: string, input: Partial<ProductInput>) => {
    try {
      return updateProduct(db, id, input);
    } catch (err: any) {
      console.error('[IPC] Error in products:update:', err);
      throw new Error(err.message || 'Failed to update product');
    }
  });

  ipcMain.handle('products:delete', async (_, id: string) => {
    try {
      return deleteProduct(db, id);
    } catch (err: any) {
      console.error('[IPC] Error in products:delete:', err);
      throw new Error(err.message || 'Failed to delete product');
    }
  });

  // Categories
  ipcMain.handle('categories:list', async () => {
    try {
      return listCategories(db);
    } catch (err: any) {
      console.error('[IPC] Error in categories:list:', err);
      throw err;
    }
  });

  ipcMain.handle('categories:create', async (_, name: string, description?: string) => {
    try {
      return createCategory(db, name, description);
    } catch (err: any) {
      console.error('[IPC] Error in categories:create:', err);
      throw new Error(err.message || 'Failed to create category');
    }
  });

  // Inventory & Stock Management
  ipcMain.handle('inventory:adjustStock', async (_, input: StockAdjustmentInput) => {
    try {
      return adjustStock(db, input);
    } catch (err: any) {
      console.error('[IPC] Error in inventory:adjustStock:', err);
      throw new Error(err.message || 'Failed to adjust stock');
    }
  });

  ipcMain.handle('inventory:getMovements', async (_, productId?: string, limit?: number) => {
    try {
      return getStockMovements(db, productId, limit);
    } catch (err: any) {
      console.error('[IPC] Error in inventory:getMovements:', err);
      throw err;
    }
  });

  ipcMain.handle('inventory:getSummary', async () => {
    try {
      return getInventorySummary(db);
    } catch (err: any) {
      console.error('[IPC] Error in inventory:getSummary:', err);
      throw err;
    }
  });

  // Invoices & Billing
  ipcMain.handle('invoices:getNextNumber', async () => {
    try {
      return getNextInvoiceNumber(db);
    } catch (err: any) {
      console.error('[IPC] Error in invoices:getNextNumber:', err);
      throw err;
    }
  });

  ipcMain.handle('invoices:create', async (_, input: CreateInvoiceInput) => {
    try {
      return createInvoice(db, input);
    } catch (err: any) {
      console.error('[IPC] Error in invoices:create:', err);
      throw new Error(err.message || 'Failed to generate invoice');
    }
  });

  ipcMain.handle('invoices:list', async (_, filter?: InvoiceFilter) => {
    try {
      return listInvoices(db, filter);
    } catch (err: any) {
      console.error('[IPC] Error in invoices:list:', err);
      throw err;
    }
  });

  ipcMain.handle('invoices:getById', async (_, id: string) => {
    try {
      return getInvoiceById(db, id);
    } catch (err: any) {
      console.error('[IPC] Error in invoices:getById:', err);
      throw err;
    }
  });

  ipcMain.handle('invoices:cancel', async (_, id: string, reason: string) => {
    try {
      return cancelInvoice(db, id, reason);
    } catch (err: any) {
      console.error('[IPC] Error in invoices:cancel:', err);
      throw new Error(err.message || 'Failed to cancel invoice');
    }
  });

  // Customer Management
  ipcMain.handle('customers:list', async (_, filter?: CustomerFilter) => {
    try {
      return listCustomers(db, filter);
    } catch (err: any) {
      console.error('[IPC] Error in customers:list:', err);
      throw err;
    }
  });

  ipcMain.handle('customers:getById', async (_, id: string) => {
    try {
      return getCustomerById(db, id);
    } catch (err: any) {
      console.error('[IPC] Error in customers:getById:', err);
      throw err;
    }
  });

  ipcMain.handle('customers:create', async (_, input: CustomerInput) => {
    try {
      return createCustomer(db, input);
    } catch (err: any) {
      console.error('[IPC] Error in customers:create:', err);
      throw new Error(err.message || 'Failed to add customer');
    }
  });

  ipcMain.handle('customers:update', async (_, id: string, input: Partial<CustomerInput>) => {
    try {
      return updateCustomer(db, id, input);
    } catch (err: any) {
      console.error('[IPC] Error in customers:update:', err);
      throw new Error(err.message || 'Failed to update customer');
    }
  });

  ipcMain.handle('customers:delete', async (_, id: string) => {
    try {
      return deleteCustomer(db, id);
    } catch (err: any) {
      console.error('[IPC] Error in customers:delete:', err);
      throw new Error(err.message || 'Failed to delete customer');
    }
  });

  // WhatsApp Integration
  ipcMain.handle('whatsapp:openChat', async (_, input: { mobile: string; message: string; customerId?: string; invoiceId?: string }) => {
    try {
      const cleanPhone = input.mobile.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12
        ? cleanPhone
        : `91${cleanPhone}`;

      const encodedMessage = encodeURIComponent(input.message);
      const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

      await shell.openExternal(url);

      logWhatsAppMessage(db, {
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        mobile: formattedPhone,
        messageText: input.message,
        status: 'OPENED',
      });

      return { success: true, url };
    } catch (err: any) {
      console.error('[IPC] Error in whatsapp:openChat:', err);
      throw new Error(err.message || 'Failed to open WhatsApp');
    }
  });

  ipcMain.handle('whatsapp:getLogs', async (_, limit?: number) => {
    try {
      return getWhatsAppLogs(db, limit);
    } catch (err: any) {
      console.error('[IPC] Error in whatsapp:getLogs:', err);
      throw err;
    }
  });

  // Printer & PDF Services
  ipcMain.handle('printers:list', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return [];
    return getInstalledPrinters(win);
  });

  ipcMain.handle('printers:print', async (_, options: PrintOptions) => {
    try {
      return await printHtml(options);
    } catch (err: any) {
      console.error('[IPC] Error in printers:print:', err);
      return { success: false, message: err.message || 'Failed to print invoice' };
    }
  });

  ipcMain.handle('printers:exportPDF', async (event, input: { htmlContent: string; paperFormat: any; defaultFileName?: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false, message: 'Window reference not found' };
    try {
      return await exportToPdfFile(win, input.htmlContent, input.paperFormat, input.defaultFileName);
    } catch (err: any) {
      console.error('[IPC] Error in printers:exportPDF:', err);
      return { success: false, message: err.message || 'Failed to export PDF' };
    }
  });

  // Cloud Synchronization Engine
  ipcMain.handle('sync:getStatus', async () => {
    try {
      return getSyncStatus(db);
    } catch (err: any) {
      console.error('[IPC] Error in sync:getStatus:', err);
      throw err;
    }
  });

  ipcMain.handle('sync:login', async (_, input: { serverUrl: string; email: string; password: string }) => {
    try {
      return await loginCloud(db, input.serverUrl, input.email, input.password);
    } catch (err: any) {
      console.error('[IPC] Error in sync:login:', err);
      throw new Error(err.message || 'Cloud login failed');
    }
  });

  ipcMain.handle('sync:trigger', async () => {
    try {
      return await triggerSync(db);
    } catch (err: any) {
      console.error('[IPC] Error in sync:trigger:', err);
      throw new Error(err.message || 'Cloud sync failed');
    }
  });

  ipcMain.handle('sync:backup', async () => {
    try {
      return await requestCloudBackup(db);
    } catch (err: any) {
      console.error('[IPC] Error in sync:backup:', err);
      throw new Error(err.message || 'Cloud backup failed');
    }
  });

  // Sales & Tax Reports
  ipcMain.handle('reports:getSummary', async (_, filter?: ReportFilter) => {
    try {
      return getSalesReportSummary(db, filter);
    } catch (err: any) {
      console.error('[IPC] Error in reports:getSummary:', err);
      throw err;
    }
  });

  ipcMain.handle('reports:exportCSV', async (event, input: { type: 'INVOICES' | 'GSTR1'; filter?: ReportFilter }) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      const gen = input.type === 'GSTR1' ? generateTaxReportCSV(db, input.filter) : generateInvoicesCSV(db, input.filter);

      if (!win) {
        return { success: false, message: 'Window reference not found' };
      }

      const saveResult = await dialog.showSaveDialog(win, {
        title: input.type === 'GSTR1' ? 'Export GSTR-1 Tax Summary CSV' : 'Export Sales Invoices CSV',
        defaultPath: gen.filename,
        filters: [{ name: 'CSV (Comma delimited)', extensions: ['csv'] }],
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, canceled: true, message: 'Export cancelled by user' };
      }

      fs.writeFileSync(saveResult.filePath, gen.csv, 'utf8');
      return {
        success: true,
        filePath: saveResult.filePath,
        filename: gen.filename,
        message: 'CSV report exported successfully!',
      };
    } catch (err: any) {
      console.error('[IPC] Error in reports:exportCSV:', err);
      return { success: false, message: err.message || 'Failed to export CSV report' };
    }
  });

  ipcMain.handle('reports:getRawCSV', async (_, input: { type: 'INVOICES' | 'GSTR1'; filter?: ReportFilter }) => {
    try {
      return input.type === 'GSTR1' ? generateTaxReportCSV(db, input.filter) : generateInvoicesCSV(db, input.filter);
    } catch (err: any) {
      console.error('[IPC] Error in reports:getRawCSV:', err);
      throw err;
    }
  });
}
