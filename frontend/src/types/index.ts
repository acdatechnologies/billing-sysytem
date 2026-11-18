export type NavigationTab =
  | 'dashboard'
  | 'billing'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'whatsapp'
  | 'history'
  | 'reports'
  | 'settings';

export interface BusinessInfo {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  state_code: string;
  website: string;
  invoice_prefix?: string;
  invoice_counter?: number;
  default_gst_rate?: number;
  default_payment_method?: string;
  paper_size?: string;
  default_printer?: string;
  invoice_footer?: string;
  terms_and_conditions?: string;
}

export interface PrinterDevice {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  status: number;
}

export interface SyncStatus {
  isConnected: boolean;
  cloudEmail: string | null;
  serverUrl: string;
  pendingCount: number;
  lastSyncTime: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  product_count?: number;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  code: string;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  opening_stock: number;
  current_stock: number;
  minimum_stock: number;
  gst_rate: number;
  hsn_code?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  code: string;
  barcode?: string;
  category_id?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  opening_stock?: number;
  minimum_stock?: number;
  gst_rate: number;
  hsn_code?: string;
  is_active?: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  unit?: string;
  movement_type: 'OPENING_STOCK' | 'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'RETURN' | 'SALE' | 'CANCELLATION';
  quantity: number;
  previous_stock: number;
  current_stock: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_at: string;
}

export interface InventorySummary {
  totalSkus: number;
  totalUnits: number;
  totalCostValuation: number;
  totalRetailValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockAdjustmentInput {
  productId: string;
  movementType: 'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'RETURN';
  quantity: number;
  notes?: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
  state_code?: string;
  total_purchases: number;
  total_bills: number;
  last_purchase_date?: string;
  whatsapp_consent: number;
  created_at: string;
  updated_at: string;
  invoices?: Invoice[];
}

export interface CustomerInput {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
  state_code?: string;
  whatsapp_consent?: number;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  hsn_code?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  taxable_value: number;
  gst_rate: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_time: string;
  customer_id?: string;
  customer_name: string;
  customer_mobile?: string;
  customer_gstin?: string;
  is_interstate: number;
  subtotal: number;
  item_discount_total: number;
  invoice_discount_total: number;
  taxable_amount: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  grand_total: number;
  round_off: number;
  amount_received: number;
  balance_due: number;
  payment_method: string;
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID';
  status: 'ACTIVE' | 'CANCELLED';
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  payments?: any[];
  business?: BusinessInfo;
}

export interface WhatsAppLog {
  id: string;
  business_id: string;
  customer_id?: string;
  customer_name?: string;
  invoice_id?: string;
  invoice_number?: string;
  mobile: string;
  message_text: string;
  status: string;
  sent_at: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  code: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  selling_price: number;
}

export interface RecentTransaction {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_time: string;
  customer_name: string;
  customer_mobile: string;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
}

export interface MonthlySale {
  month: string;
  sales: number;
  bills: number;
}

export interface DashboardMetrics {
  todaySales: number;
  todayBills: number;
  totalProducts: number;
  availableStock: number;
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
  recentTransactions: RecentTransaction[];
  monthlySales: MonthlySale[];
  businessInfo?: BusinessInfo;
}

export interface ReportFilter {
  period?: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
}

export interface PaymentBreakdownItem {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface TaxRateBreakdownItem {
  gstRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface ProductSalesItem {
  productId: string;
  productName: string;
  productCode: string;
  hsnCode?: string;
  unit: string;
  unitsSold: number;
  totalRevenue: number;
  avgPrice: number;
}

export interface DailySalesItem {
  date: string;
  invoiceCount: number;
  totalSales: number;
  collected: number;
}

export interface SalesReportSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalInvoicedSales: number;
  totalCollected: number;
  totalOutstanding: number;
  totalInvoicesCount: number;
  cancelledInvoicesCount: number;
  cancelledTotal: number;
  averageBillValue: number;

  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalDiscount: number;

  paymentBreakdown: PaymentBreakdownItem[];
  taxRateBreakdown: TaxRateBreakdownItem[];
  topProducts: ProductSalesItem[];
  dailyTimeline: DailySalesItem[];
}

export interface ElectronAPI {
  ping: () => Promise<{ status: string; timestamp: string }>;
  getAppInfo: () => Promise<{ version: string; name: string; databasePath: string; isPackaged: boolean; platform: string }>;
  getBusinessInfo: () => Promise<BusinessInfo>;
  savePrinterSettings: (input: { paperSize: string; defaultPrinter?: string }) => Promise<{ success: boolean }>;
  getDashboardMetrics: () => Promise<DashboardMetrics>;

  // Products
  getProducts: (filter?: any) => Promise<Product[]>;
  getProductById: (id: string) => Promise<Product>;
  createProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: string, input: Partial<ProductInput>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<{ success: boolean; softDeleted: boolean; message: string }>;

  // Categories
  getCategories: () => Promise<ProductCategory[]>;
  createCategory: (name: string, description?: string) => Promise<ProductCategory>;

  // Inventory
  adjustStock: (input: StockAdjustmentInput) => Promise<any>;
  getStockMovements: (productId?: string, limit?: number) => Promise<StockMovement[]>;
  getInventorySummary: () => Promise<InventorySummary>;

  // Invoices & Billing
  getNextInvoiceNumber: () => Promise<string>;
  createInvoice: (input: any) => Promise<Invoice>;
  getInvoices: (filter?: any) => Promise<Invoice[]>;
  getInvoiceById: (id: string) => Promise<Invoice>;
  cancelInvoice: (id: string, reason: string) => Promise<Invoice>;

  // Customers
  getCustomers: (filter?: any) => Promise<Customer[]>;
  getCustomerById: (id: string) => Promise<Customer>;
  createCustomer: (input: CustomerInput) => Promise<Customer>;
  updateCustomer: (id: string, input: Partial<CustomerInput>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<{ success: boolean }>;

  // WhatsApp
  openWhatsApp: (input: { mobile: string; message: string; customerId?: string; invoiceId?: string }) =>
    Promise<{ success: boolean; url: string }>;
  getWhatsAppLogs: (limit?: number) => Promise<WhatsAppLog[]>;

  // Printers & PDF
  getInstalledPrinters: () => Promise<PrinterDevice[]>;
  printInvoice: (options: any) => Promise<{ success: boolean; message: string }>;
  exportPDF: (input: any) => Promise<{ success: boolean; filePath?: string; message: string }>;

  // Cloud Synchronization Engine
  getSyncStatus: () => Promise<SyncStatus>;
  loginCloud: (input: { serverUrl: string; email: string; password: string }) =>
    Promise<{ success: boolean; business: any; token: string }>;
  triggerSync: () => Promise<{ success: boolean; pushedCount: number; pulledCount: number; timestamp: string }>;
  requestCloudBackup: () => Promise<{ success: boolean; message: string; backup: any }>;

  // Reports & Analytics
  getSalesReport: (filter?: ReportFilter) => Promise<SalesReportSummary>;
  exportSalesReportCSV: (input: { type: 'INVOICES' | 'GSTR1'; filter?: ReportFilter }) =>
    Promise<{ success: boolean; filePath?: string; filename?: string; canceled?: boolean; message: string }>;
  getRawSalesReportCSV: (input: { type: 'INVOICES' | 'GSTR1'; filter?: ReportFilter }) =>
    Promise<{ csv: string; filename: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
