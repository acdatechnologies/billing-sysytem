import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  ping: () => ipcRenderer.invoke('app:ping'),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getBusinessInfo: () => ipcRenderer.invoke('business:getInfo'),
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
  getCustomers: () => ipcRenderer.invoke('customers:list'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
