import Database from 'better-sqlite3';

export interface DashboardMetrics {
  todaySales: number;
  todayBills: number;
  totalProducts: number;
  availableStock: number;
  lowStockCount: number;
  lowStockProducts: any[];
  recentTransactions: any[];
  monthlySales: { month: string; sales: number; bills: number }[];
  businessInfo: any;
}

export function getDashboardMetrics(db: Database.Database): DashboardMetrics {
  // Today's sales & bill count
  const todayRow = db.prepare(`
    SELECT
      COALESCE(SUM(grand_total), 0) as todaySales,
      COUNT(id) as todayBills
    FROM invoices
    WHERE status = 'ACTIVE'
      AND date(invoice_date) = date('now', 'localtime')
  `).get() as { todaySales: number; todayBills: number };

  // Total products & active stock
  const productRow = db.prepare(`
    SELECT
      COUNT(id) as totalProducts,
      COALESCE(SUM(current_stock), 0) as availableStock
    FROM products
    WHERE is_active = 1
  `).get() as { totalProducts: number; availableStock: number };

  // Low stock products
  const lowStockProducts = db.prepare(`
    SELECT id, name, code, current_stock, minimum_stock, unit, selling_price
    FROM products
    WHERE is_active = 1 AND current_stock <= minimum_stock
    ORDER BY current_stock ASC
    LIMIT 10
  `).all();

  const lowStockCountRow = db.prepare(`
    SELECT COUNT(id) as lowCount
    FROM products
    WHERE is_active = 1 AND current_stock <= minimum_stock
  `).get() as { lowCount: number };

  // Recent transactions
  const recentTransactions = db.prepare(`
    SELECT
      id,
      invoice_number,
      invoice_date,
      invoice_time,
      customer_name,
      customer_mobile,
      grand_total,
      payment_method,
      payment_status,
      status,
      created_at
    FROM invoices
    ORDER BY created_at DESC
    LIMIT 8
  `).all();

  // Monthly sales for the last 6 months
  const monthlySalesRaw = db.prepare(`
    SELECT
      strftime('%Y-%m', invoice_date) as month,
      COALESCE(SUM(grand_total), 0) as sales,
      COUNT(id) as bills
    FROM invoices
    WHERE status = 'ACTIVE'
    GROUP BY strftime('%Y-%m', invoice_date)
    ORDER BY month DESC
    LIMIT 6
  `).all() as { month: string; sales: number; bills: number }[];

  const businessInfo = db.prepare(`
    SELECT b.*, s.invoice_prefix, s.default_gst_rate, s.paper_size, s.invoice_footer
    FROM businesses b
    LEFT JOIN business_settings s ON b.id = s.business_id
    LIMIT 1
  `).get();

  return {
    todaySales: todayRow.todaySales || 0,
    todayBills: todayRow.todayBills || 0,
    totalProducts: productRow.totalProducts || 0,
    availableStock: productRow.availableStock || 0,
    lowStockCount: lowStockCountRow.lowCount || 0,
    lowStockProducts,
    recentTransactions,
    monthlySales: monthlySalesRaw.reverse(),
    businessInfo,
  };
}
