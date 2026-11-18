import Database from 'better-sqlite3';
import Decimal from 'decimal.js';

export interface ReportFilter {
  period?: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
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

function resolveDateRange(filter?: ReportFilter): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const period = filter?.period || 'THIS_MONTH';

  if (period === 'CUSTOM' && filter?.startDate && filter?.endDate) {
    return {
      startDate: filter.startDate,
      endDate: filter.endDate,
      label: `Custom: ${filter.startDate} to ${filter.endDate}`,
    };
  }

  if (period === 'TODAY') {
    const today = formatYMD(now);
    return { startDate: today, endDate: today, label: 'Today' };
  }

  if (period === 'YESTERDAY') {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const d = formatYMD(yest);
    return { startDate: d, endDate: d, label: 'Yesterday' };
  }

  if (period === 'THIS_WEEK') {
    const current = new Date(now);
    const firstDay = current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1); // Monday start
    const monday = new Date(current.setDate(firstDay));
    return {
      startDate: formatYMD(monday),
      endDate: formatYMD(now),
      label: 'This Week',
    };
  }

  if (period === 'LAST_MONTH') {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: formatYMD(firstDayLastMonth),
      endDate: formatYMD(lastDayLastMonth),
      label: 'Last Month',
    };
  }

  if (period === 'THIS_YEAR') {
    const firstDayYear = new Date(now.getFullYear(), 0, 1);
    return {
      startDate: formatYMD(firstDayYear),
      endDate: formatYMD(now),
      label: `This Year (${now.getFullYear()})`,
    };
  }

  // Default: THIS_MONTH
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: formatYMD(firstDayMonth),
    endDate: formatYMD(now),
    label: 'This Month',
  };
}

export function getSalesReportSummary(db: Database.Database, filter?: ReportFilter): SalesReportSummary {
  const { startDate, endDate, label } = resolveDateRange(filter);

  // 1. KPI Aggregates for Active Invoices
  const kpiQuery = db.prepare(`
    SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(grand_total), 0) as total_invoiced,
      COALESCE(SUM(amount_received), 0) as total_received,
      COALESCE(SUM(balance_due), 0) as total_outstanding,
      COALESCE(SUM(taxable_amount), 0) as total_taxable,
      COALESCE(SUM(cgst_total), 0) as total_cgst,
      COALESCE(SUM(sgst_total), 0) as total_sgst,
      COALESCE(SUM(igst_total), 0) as total_igst,
      COALESCE(SUM(item_discount_total + invoice_discount_total), 0) as total_discount
    FROM invoices
    WHERE status = 'ACTIVE'
      AND invoice_date BETWEEN ? AND ?
  `);
  const kpiRow = kpiQuery.get(startDate, endDate) as any;

  // 2. Cancelled Invoices
  const cancelledRow = db.prepare(`
    SELECT 
      COUNT(*) as cancelled_count,
      COALESCE(SUM(grand_total), 0) as cancelled_total
    FROM invoices
    WHERE status = 'CANCELLED'
      AND invoice_date BETWEEN ? AND ?
  `).get(startDate, endDate) as any;

  const totalInvoicedSales = Number(kpiRow.total_invoiced || 0);
  const totalCollected = Number(kpiRow.total_received || 0);
  const totalOutstanding = Number(kpiRow.total_outstanding || 0);
  const totalInvoicesCount = Number(kpiRow.total_invoices || 0);
  const cancelledInvoicesCount = Number(cancelledRow.cancelled_count || 0);
  const cancelledTotal = Number(cancelledRow.cancelled_total || 0);
  const averageBillValue = totalInvoicesCount > 0 ? Math.round((totalInvoicedSales / totalInvoicesCount) * 100) / 100 : 0;

  const totalTaxable = Number(kpiRow.total_taxable || 0);
  const totalCgst = Number(kpiRow.total_cgst || 0);
  const totalSgst = Number(kpiRow.total_sgst || 0);
  const totalIgst = Number(kpiRow.total_igst || 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const totalDiscount = Number(kpiRow.total_discount || 0);

  // 3. Payment Method Breakdown
  const paymentRows = db.prepare(`
    SELECT 
      payment_method,
      COUNT(*) as payment_count,
      COALESCE(SUM(amount), 0) as total_amount
    FROM payments
    WHERE invoice_id IN (
      SELECT id FROM invoices WHERE status = 'ACTIVE' AND invoice_date BETWEEN ? AND ?
    )
    GROUP BY payment_method
    ORDER BY total_amount DESC
  `).all(startDate, endDate) as any[];

  const paymentBreakdown: PaymentBreakdownItem[] = paymentRows.map(row => {
    const amt = Number(row.total_amount || 0);
    const pct = totalCollected > 0 ? Math.round((amt / totalCollected) * 1000) / 10 : 0;
    return {
      method: row.payment_method || 'CASH',
      count: Number(row.payment_count || 0),
      amount: amt,
      percentage: pct,
    };
  });

  // 4. Tax Rate Breakdown (GSTR-1 summary)
  const taxRows = db.prepare(`
    SELECT 
      ii.gst_rate,
      COALESCE(SUM(ii.taxable_value), 0) as taxable_amount,
      COALESCE(SUM(ii.cgst_amount), 0) as cgst_amount,
      COALESCE(SUM(ii.sgst_amount), 0) as sgst_amount,
      COALESCE(SUM(ii.igst_amount), 0) as igst_amount,
      COALESCE(SUM(ii.cgst_amount + ii.sgst_amount + ii.igst_amount), 0) as total_tax,
      COALESCE(SUM(ii.total_amount), 0) as total_amount
    FROM invoice_items ii
    JOIN invoices inv ON ii.invoice_id = inv.id
    WHERE inv.status = 'ACTIVE'
      AND inv.invoice_date BETWEEN ? AND ?
    GROUP BY ii.gst_rate
    ORDER BY ii.gst_rate ASC
  `).all(startDate, endDate) as any[];

  const taxRateBreakdown: TaxRateBreakdownItem[] = taxRows.map(row => ({
    gstRate: Number(row.gst_rate || 0),
    taxableAmount: Math.round(Number(row.taxable_amount || 0) * 100) / 100,
    cgstAmount: Math.round(Number(row.cgst_amount || 0) * 100) / 100,
    sgstAmount: Math.round(Number(row.sgst_amount || 0) * 100) / 100,
    igstAmount: Math.round(Number(row.igst_amount || 0) * 100) / 100,
    totalTax: Math.round(Number(row.total_tax || 0) * 100) / 100,
    totalAmount: Math.round(Number(row.total_amount || 0) * 100) / 100,
  }));

  // 5. Top Products Sold
  const productRows = db.prepare(`
    SELECT 
      ii.product_id,
      ii.product_name,
      ii.product_code,
      ii.hsn_code,
      ii.unit,
      COALESCE(SUM(ii.quantity), 0) as units_sold,
      COALESCE(SUM(ii.total_amount), 0) as total_revenue,
      COALESCE(AVG(ii.unit_price), 0) as avg_price
    FROM invoice_items ii
    JOIN invoices inv ON ii.invoice_id = inv.id
    WHERE inv.status = 'ACTIVE'
      AND inv.invoice_date BETWEEN ? AND ?
    GROUP BY ii.product_id, ii.product_name, ii.product_code, ii.unit
    ORDER BY total_revenue DESC
    LIMIT 25
  `).all(startDate, endDate) as any[];

  const topProducts: ProductSalesItem[] = productRows.map(row => ({
    productId: row.product_id,
    productName: row.product_name,
    productCode: row.product_code,
    hsnCode: row.hsn_code || '-',
    unit: row.unit || 'PCS',
    unitsSold: Number(row.units_sold || 0),
    totalRevenue: Math.round(Number(row.total_revenue || 0) * 100) / 100,
    avgPrice: Math.round(Number(row.avg_price || 0) * 100) / 100,
  }));

  // 6. Daily Timeline
  const dailyRows = db.prepare(`
    SELECT 
      invoice_date as date,
      COUNT(*) as invoice_count,
      COALESCE(SUM(grand_total), 0) as total_sales,
      COALESCE(SUM(amount_received), 0) as collected
    FROM invoices
    WHERE status = 'ACTIVE'
      AND invoice_date BETWEEN ? AND ?
    GROUP BY invoice_date
    ORDER BY invoice_date ASC
  `).all(startDate, endDate) as any[];

  const dailyTimeline: DailySalesItem[] = dailyRows.map(row => ({
    date: row.date,
    invoiceCount: Number(row.invoice_count || 0),
    totalSales: Math.round(Number(row.total_sales || 0) * 100) / 100,
    collected: Math.round(Number(row.collected || 0) * 100) / 100,
  }));

  return {
    periodLabel: label,
    startDate,
    endDate,
    totalInvoicedSales,
    totalCollected,
    totalOutstanding,
    totalInvoicesCount,
    cancelledInvoicesCount,
    cancelledTotal,
    averageBillValue,

    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,

    paymentBreakdown,
    taxRateBreakdown,
    topProducts,
    dailyTimeline,
  };
}

/**
 * Generates CSV string for Invoices export
 */
export function generateInvoicesCSV(db: Database.Database, filter?: ReportFilter): { csv: string; filename: string } {
  const { startDate, endDate } = resolveDateRange(filter);

  const invoices = db.prepare(`
    SELECT 
      invoice_number,
      invoice_date,
      invoice_time,
      customer_name,
      customer_mobile,
      customer_gstin,
      is_interstate,
      subtotal,
      (item_discount_total + invoice_discount_total) as discount_total,
      taxable_amount,
      cgst_total,
      sgst_total,
      igst_total,
      grand_total,
      amount_received,
      balance_due,
      payment_method,
      payment_status,
      status
    FROM invoices
    WHERE invoice_date BETWEEN ? AND ?
    ORDER BY invoice_date DESC, invoice_time DESC
  `).all(startDate, endDate) as any[];

  const headers = [
    'Invoice Number',
    'Date',
    'Time',
    'Customer Name',
    'Mobile',
    'GSTIN',
    'Tax Type',
    'Subtotal (INR)',
    'Discount (INR)',
    'Taxable Value (INR)',
    'CGST (INR)',
    'SGST (INR)',
    'IGST (INR)',
    'Grand Total (INR)',
    'Amount Received (INR)',
    'Balance Due (INR)',
    'Payment Method',
    'Payment Status',
    'Invoice Status'
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = invoices.map(inv => [
    escapeCSV(inv.invoice_number),
    escapeCSV(inv.invoice_date),
    escapeCSV(inv.invoice_time),
    escapeCSV(inv.customer_name),
    escapeCSV(inv.customer_mobile || ''),
    escapeCSV(inv.customer_gstin || ''),
    escapeCSV(inv.is_interstate ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'),
    inv.subtotal.toFixed(2),
    inv.discount_total.toFixed(2),
    inv.taxable_amount.toFixed(2),
    inv.cgst_total.toFixed(2),
    inv.sgst_total.toFixed(2),
    inv.igst_total.toFixed(2),
    inv.grand_total.toFixed(2),
    inv.amount_received.toFixed(2),
    inv.balance_due.toFixed(2),
    escapeCSV(inv.payment_method),
    escapeCSV(inv.payment_status),
    escapeCSV(inv.status),
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const filename = `VND_Sales_Report_${startDate}_to_${endDate}.csv`;

  return { csv: csvContent, filename };
}

/**
 * Generates GSTR-1 Tax Summary CSV
 */
export function generateTaxReportCSV(db: Database.Database, filter?: ReportFilter): { csv: string; filename: string } {
  const { startDate, endDate } = resolveDateRange(filter);

  const taxRows = db.prepare(`
    SELECT 
      ii.gst_rate,
      COALESCE(SUM(ii.taxable_value), 0) as taxable_amount,
      COALESCE(SUM(ii.cgst_amount), 0) as cgst_amount,
      COALESCE(SUM(ii.sgst_amount), 0) as sgst_amount,
      COALESCE(SUM(ii.igst_amount), 0) as igst_amount,
      COALESCE(SUM(ii.cgst_amount + ii.sgst_amount + ii.igst_amount), 0) as total_tax,
      COALESCE(SUM(ii.total_amount), 0) as total_amount
    FROM invoice_items ii
    JOIN invoices inv ON ii.invoice_id = inv.id
    WHERE inv.status = 'ACTIVE'
      AND inv.invoice_date BETWEEN ? AND ?
    GROUP BY ii.gst_rate
    ORDER BY ii.gst_rate ASC
  `).all(startDate, endDate) as any[];

  const headers = [
    'GST Rate (%)',
    'Taxable Value (INR)',
    'Central GST / CGST (INR)',
    'State GST / SGST (INR)',
    'Integrated GST / IGST (INR)',
    'Total Tax Collected (INR)',
    'Gross Invoice Value (INR)'
  ];

  const rows = taxRows.map(r => [
    `"${r.gst_rate}%"`,
    Number(r.taxable_amount).toFixed(2),
    Number(r.cgst_amount).toFixed(2),
    Number(r.sgst_amount).toFixed(2),
    Number(r.igst_amount).toFixed(2),
    Number(r.total_tax).toFixed(2),
    Number(r.total_amount).toFixed(2),
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const filename = `VND_GSTR1_Tax_Report_${startDate}_to_${endDate}.csv`;

  return { csv: csvContent, filename };
}
