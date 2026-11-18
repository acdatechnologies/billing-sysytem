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
  invoice_footer?: string;
  terms_and_conditions?: string;
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

export interface ElectronAPI {
  ping: () => Promise<{ status: string; timestamp: string }>;
  getAppInfo: () => Promise<{ version: string; name: string; databasePath: string; isPackaged: boolean; platform: string }>;
  getBusinessInfo: () => Promise<BusinessInfo>;
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

  // Customers
  getCustomers: () => Promise<any[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
