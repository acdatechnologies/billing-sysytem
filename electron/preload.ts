import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  ping: () => ipcRenderer.invoke('app:ping'),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getBusinessInfo: () => ipcRenderer.invoke('business:getInfo'),
  savePrinterSettings: (input: { paperSize: string; defaultPrinter?: string }) =>
    ipcRenderer.invoke('settings:savePrinter', input),
  getDashboardMetrics: () => ipcRenderer.invoke('dashboard:getMetrics'),

  // Products
  getProducts: (filter?: any) => ipcRenderer.invoke('products:list', filter),
  getProductById: (id: string) => ipcRenderer.invoke('products:getById', id),
  createProduct: (input: any) => ipcRenderer.invoke('products:create', input),
  updateProduct: (id: string, input: any) => ipcRenderer.invoke('products:update', id, input),
  deleteProduct: (id: string) => ipcRenderer.invoke('products:delete', id),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories:list'),
  createCategory: (name: string, description?: string) => ipcRenderer.invoke('categories:create', name, description),

  // Inventory
  adjustStock: (input: any) => ipcRenderer.invoke('inventory:adjustStock', input),
  getStockMovements: (productId?: string, limit?: number) => ipcRenderer.invoke('inventory:getMovements', productId, limit),
  getInventorySummary: () => ipcRenderer.invoke('inventory:getSummary'),

  // Invoices & Billing
  getNextInvoiceNumber: () => ipcRenderer.invoke('invoices:getNextNumber'),
  createInvoice: (input: any) => ipcRenderer.invoke('invoices:create', input),
  getInvoices: (filter?: any) => ipcRenderer.invoke('invoices:list', filter),
  getInvoiceById: (id: string) => ipcRenderer.invoke('invoices:getById', id),
  cancelInvoice: (id: string, reason: string) => ipcRenderer.invoke('invoices:cancel', id, reason),

  // Customers
  getCustomers: (filter?: any) => ipcRenderer.invoke('customers:list', filter),
  getCustomerById: (id: string) => ipcRenderer.invoke('customers:getById', id),
  createCustomer: (input: any) => ipcRenderer.invoke('customers:create', input),
  updateCustomer: (id: string, input: any) => ipcRenderer.invoke('customers:update', id, input),
  deleteCustomer: (id: string) => ipcRenderer.invoke('customers:delete', id),

  // WhatsApp
  openWhatsApp: (input: { mobile: string; message: string; customerId?: string; invoiceId?: string }) =>
    ipcRenderer.invoke('whatsapp:openChat', input),
  getWhatsAppLogs: (limit?: number) => ipcRenderer.invoke('whatsapp:getLogs', limit),

  // Printers & PDF
  getInstalledPrinters: () => ipcRenderer.invoke('printers:list'),
  printInvoice: (options: any) => ipcRenderer.invoke('printers:print', options),
  exportPDF: (input: any) => ipcRenderer.invoke('printers:exportPDF', input),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
