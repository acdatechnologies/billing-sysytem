import { Invoice } from '../models/Invoice.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';

export async function getDashboardMetrics(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];

    // Today's invoices
    const todayInvoices = await Invoice.find({
      businessId,
      invoiceDate: todayStr,
      status: 'ACTIVE',
    });

    const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const todayInvoiceCount = todayInvoices.length;

    // Monthly invoices
    const monthInvoices = await Invoice.find({
      businessId,
      invoiceDate: { $gte: firstDayOfMonth },
      status: 'ACTIVE',
    });

    const monthlySales = monthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const monthlyInvoiceCount = monthInvoices.length;

    // Product & Low stock counts
    const products = await Product.find({ businessId, isActive: 1 });
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.currentStock <= p.minimumStock).length;

    // Total Customers
    const totalCustomers = await Customer.countDocuments({ businessId });

    // Recent 5 invoices
    const recentInvoices = await Invoice.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly sales formatted as array of month summaries
    const curMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
    const monthlySalesArray = [
      {
        month: curMonthName,
        sales: monthlySales,
        bills: monthlyInvoiceCount,
      },
    ];

    // Low stock products
    const lowStockProducts = products
      .filter((p) => p.currentStock <= p.minimumStock)
      .slice(0, 10)
      .map((p) => ({
        id: p.productId || p._id,
        name: p.name,
        code: p.code,
        current_stock: p.currentStock,
        minimum_stock: p.minimumStock,
        unit: p.unit,
        selling_price: p.sellingPrice,
      }));

    res.json({
      success: true,
      data: {
        todaySales,
        todayBills: todayInvoiceCount,
        totalProducts,
        availableStock: products.reduce((sum, p) => sum + (p.currentStock || 0), 0),
        lowStockCount,
        lowStockProducts,
        totalCustomers,
        recentTransactions: recentInvoices.map((inv) => ({
          id: inv.invoiceId || inv._id,
          invoice_number: inv.invoiceNumber,
          customer_name: inv.customerName,
          customer_mobile: inv.customerMobile,
          grand_total: inv.grandTotal,
          payment_method: inv.paymentMethod,
          payment_status: inv.paymentStatus,
          status: inv.status,
          created_at: inv.createdAt,
        })),
        monthlySales: monthlySalesArray,
      },
    });
  } catch (err) {
    next(err);
  }
}
