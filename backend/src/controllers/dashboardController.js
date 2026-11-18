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

    res.json({
      success: true,
      data: {
        todaySales,
        todayInvoiceCount,
        monthlySales,
        monthlyInvoiceCount,
        totalProducts,
        lowStockCount,
        totalCustomers,
        recentInvoices,
      },
    });
  } catch (err) {
    next(err);
  }
}
