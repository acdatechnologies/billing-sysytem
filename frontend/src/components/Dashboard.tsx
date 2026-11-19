import React from 'react';
import {
  IndianRupee,
  Receipt,
  Package,
  Boxes,
  AlertTriangle,
  ArrowRight,
  Clock,
  TrendingUp,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DashboardMetrics, NavigationTab } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics;
  onNavigate: (tab: NavigationTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ metrics, onNavigate }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const monthlySalesList = Array.isArray(metrics?.monthlySales) ? metrics.monthlySales : [];
  const lowStockList = Array.isArray(metrics?.lowStockProducts) ? metrics.lowStockProducts : [];
  const recentTransactionsList = Array.isArray(metrics?.recentTransactions)
    ? metrics.recentTransactions
    : (Array.isArray((metrics as any)?.recentInvoices) ? (metrics as any).recentInvoices : []);

  // Find max sales for SVG scaling
  const maxMonthlySales = Math.max(
    ...(monthlySalesList.length > 0 ? monthlySalesList.map((m) => Number(m.sales) || 0) : [0]),
    1000
  );

  return (
    <div className="space-y-6">
      {/* 5 Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(metrics.todaySales)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> From active invoices today
            </p>
          </div>
        </div>

        {/* Total Bills Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Bills
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {metrics.todayBills}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Generated invoices today
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {metrics.totalProducts}
            </h3>
            <button
              onClick={() => onNavigate('products')}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium mt-1 flex items-center gap-0.5"
            >
              View catalog <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Available Stock */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Available Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {metrics.availableStock}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Total units across catalog
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigate('inventory')}
          className={`bg-white p-5 rounded-xl border cursor-pointer shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow ${
            metrics.lowStockCount > 0
              ? 'border-amber-300 bg-amber-50/20'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                metrics.lowStockCount > 0
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl font-bold tracking-tight ${
                metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-800'
              }`}
            >
              {metrics.lowStockCount}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-0.5">
              Items need replenishment <ArrowRight className="w-2.5 h-2.5" />
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Sales Performance Chart & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales SVG Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Monthly Sales Overview
              </h3>
              <p className="text-xs text-slate-500">
                Revenue trends recorded from local database
              </p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
            >
              Full Reports <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {monthlySalesList.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-sm font-medium">No sales recorded yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Create your first bill to see live analytics
              </p>
            </div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-4 pt-6 px-2">
              {monthlySalesList.map((item) => {
                const heightPercent = Math.max(
                  (item.sales / maxMonthlySales) * 100,
                  6
                );
                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center h-full justify-end group"
                  >
                    <div className="text-[10px] text-slate-500 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(item.sales)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[48px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md group-hover:from-blue-500 group-hover:to-indigo-400 transition-all duration-200 relative shadow-xs"
                    ></div>
                    <span className="text-[11px] font-medium text-slate-600 mt-2 truncate max-w-full">
                      {item.month}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.bills} bills
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Operations Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Quick Actions
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Frequent daily tasks for shop owners
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('billing')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900 transition-colors text-left"
              >
                <div>
                  <h4 className="text-xs font-bold">Create New GST Invoice</h4>
                  <p className="text-[11px] text-blue-700/80">
                    Fast product search, barcode & tax
                  </p>
                </div>
                <Receipt className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={() => onNavigate('products')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors text-left"
              >
                <div>
                  <h4 className="text-xs font-bold">Add New Product</h4>
                  <p className="text-[11px] text-slate-500">
                    Define price, HSN, and GST rates
                  </p>
                </div>
                <Package className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('inventory')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors text-left"
              >
                <div>
                  <h4 className="text-xs font-bold">Adjust Physical Stock</h4>
                  <p className="text-[11px] text-slate-500">
                    Record stock intake or corrections
                  </p>
                </div>
                <Boxes className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Offline-First Engine:</span>{' '}
            All billing and stock actions happen instantly on local SQLite.
          </div>
        </div>
      </div>

      {/* Bottom Grid: Low Stock Alert Table & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Low Stock Warning ({metrics.lowStockCount})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-blue-600 font-semibold hover:text-blue-800"
            >
              Manage Inventory
            </button>
          </div>

          {lowStockList.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">
                Healthy Stock Levels
              </p>
              <p className="text-xs text-slate-400">
                No products are currently below their minimum threshold.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Product Name</th>
                    <th className="py-2.5 px-3 font-semibold">Code</th>
                    <th className="py-2.5 px-3 font-semibold text-right">In Stock</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Min Stock</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {p.code}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-red-50 text-red-600 border border-red-200">
                          {p.current_stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {p.minimum_stock} {p.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                        {formatCurrency(p.selling_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Recent Invoices
              </h3>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-blue-600 font-semibold hover:text-blue-800"
            >
              View All History
            </button>
          </div>

          {recentTransactionsList.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                No Invoices Issued Yet
              </p>
              <p className="text-xs text-slate-400">
                Bills generated from "New Billing" will be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                    <th className="py-2.5 px-3 font-semibold">Customer</th>
                    <th className="py-2.5 px-3 font-semibold">Time</th>
                    <th className="py-2.5 px-3 font-semibold">Payment</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactionsList.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-600">
                        {tx.invoice_number}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {tx.customer_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {tx.invoice_time || tx.invoice_date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {tx.payment_method}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                        {formatCurrency(tx.grand_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
