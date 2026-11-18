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
  getProducts: () => Promise<any[]>;
  getCustomers: () => Promise<any[]>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
