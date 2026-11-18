import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Percent,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Layers,
  FileText,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  SalesReportSummary,
  ReportFilter,
  TaxRateBreakdownItem,
  PaymentBreakdownItem,
  ProductSalesItem,
  DailySalesItem,
} from '../types';

export const SalesReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportFilter['period']>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'tax' | 'payments' | 'products' | 'timeline'>('tax');

  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<SalesReportSummary | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const filter: ReportFilter = {
          period: selectedPeriod,
          startDate: selectedPeriod === 'CUSTOM' ? customStartDate : undefined,
          endDate: selectedPeriod === 'CUSTOM' ? customEndDate : undefined,
        };
        const data = await window.electronAPI.getSalesReport(filter);
        setReport(data);
      }
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setStatusMessage({ text: 'Failed to load report data: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedPeriod]);

  const handleApplyCustomDate = () => {
    if (selectedPeriod === 'CUSTOM') {
      fetchReport();
    } else {
      setSelectedPeriod('CUSTOM');
    }
  };

  const handleExportCSV = async (type: 'INVOICES' | 'GSTR1') => {
    if (!window.electronAPI) return;
    setExporting(true);
    setStatusMessage(null);
    try {
      const filter: ReportFilter = {
        period: selectedPeriod,
        startDate: selectedPeriod === 'CUSTOM' ? customStartDate : undefined,
        endDate: selectedPeriod === 'CUSTOM' ? customEndDate : undefined,
      };
      const result = await window.electronAPI.exportSalesReportCSV({ type, filter });
      if (result.success) {
        setStatusMessage({
          text: `${type === 'GSTR1' ? 'GSTR-1 Tax Summary' : 'Sales Invoices'} exported: ${result.filename}`,
          type: 'success',
        });
      } else if (!result.canceled) {
        setStatusMessage({ text: result.message || 'Export failed.', type: 'error' });
      }
    } catch (err: any) {
      console.error('CSV Export error:', err);
      setStatusMessage({ text: 'Export error: ' + err.message, type: 'error' });
    } finally {
      setExporting(false);
      setTimeout(() => setStatusMessage(null), 7000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const periods: { label: string; value: ReportFilter['period'] }[] = [
    { label: 'Today', value: 'TODAY' },
    { label: 'Yesterday', value: 'YESTERDAY' },
    { label: 'This Week', value: 'THIS_WEEK' },
    { label: 'This Month', value: 'THIS_MONTH' },
    { label: 'Last Month', value: 'LAST_MONTH' },
    { label: 'This Year', value: 'THIS_YEAR' },
    { label: 'Custom Range', value: 'CUSTOM' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Tax Reports</h1>
            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-200">
              GSTR-1 Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time business performance analytics, GST compliance tables, payment reconciliation, and audit logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchReport()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </button>

          <div className="relative inline-block text-left">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV('INVOICES')}
                disabled={exporting || loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export Invoices (CSV)
              </button>

              <button
                onClick={() => handleExportCSV('GSTR1')}
                disabled={exporting || loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-purple-100" />
                Export GSTR-1 Tax (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Notification Toast */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border shadow-xs transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Date Range Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Period Pills */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Period:
          </span>
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedPeriod === p.value
                  ? 'bg-purple-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs (Shown when Custom Range is selected) */}
        {selectedPeriod === 'CUSTOM' && (
          <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-none text-slate-700 font-medium"
              />
              <span className="text-xs text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-none text-slate-700 font-medium"
              />
            </div>
            <button
              onClick={handleApplyCustomDate}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {/* Active Range Display */}
        {report && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>
              Showing: <strong className="text-slate-800">{report.periodLabel}</strong> ({report.startDate} to {report.endDate})
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Invoiced Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {report ? formatCurrency(report.totalInvoicedSales) : '₹0.00'}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
            <span className="bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">
              {report?.totalInvoicesCount || 0} Invoices
            </span>
            <span>Avg {report ? formatCurrency(report.averageBillValue) : '₹0'} / bill</span>
          </div>
        </div>

        {/* Collected Payments */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Collected Amount</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700 tracking-tight">
            {report ? formatCurrency(report.totalCollected) : '₹0.00'}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
            <span className="bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded">
              {report && report.totalInvoicedSales > 0
                ? Math.round((report.totalCollected / report.totalInvoicedSales) * 100)
                : 100}
              % Realized
            </span>
            <span>Across all payment modes</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${report && report.totalOutstanding > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {report ? formatCurrency(report.totalOutstanding) : '₹0.00'}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
            <span className={`font-medium px-2 py-0.5 rounded ${report && report.totalOutstanding > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              Pending Receivables
            </span>
            <span>Due from customers</span>
          </div>
        </div>

        {/* Total GST Tax Collected */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total GST Collected</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700 tracking-tight">
            {report ? formatCurrency(report.totalTax) : '₹0.00'}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>CGST: {report ? formatCurrency(report.totalCgst) : '₹0'}</span>
            <span>SGST: {report ? formatCurrency(report.totalSgst) : '₹0'}</span>
            {report && report.totalIgst > 0 && <span>IGST: {formatCurrency(report.totalIgst)}</span>}
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      {report && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-slate-400">Total Taxable Value: </span>
              <strong className="text-slate-800">{formatCurrency(report.totalTaxable)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Total Discounts: </span>
              <strong className="text-slate-800">{formatCurrency(report.totalDiscount)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Active Invoices: </span>
              <strong className="text-emerald-700">{report.totalInvoicesCount}</strong>
            </div>
            <div>
              <span className="text-slate-400">Cancelled Invoices: </span>
              <strong className="text-red-600">
                {report.cancelledInvoicesCount} ({formatCurrency(report.cancelledTotal)})
              </strong>
            </div>
          </div>
          <div className="text-slate-500 italic">
            All metrics calculated from immutable local ledger transactions
          </div>
        </div>
      )}

      {/* Report Breakdown Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-4 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tax')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tax'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Percent className="w-4 h-4 text-purple-600" />
            GSTR-1 Tax Summary ({report?.taxRateBreakdown.length || 0} Slabs)
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            Payment Mode Summary ({report?.paymentBreakdown.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            Product Sales Breakdown ({report?.topProducts.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            Daily Sales Ledger ({report?.dailyTimeline.length || 0} Days)
          </button>
        </div>

        {/* Tab 1: GSTR-1 Tax Breakdown */}
        {activeTab === 'tax' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">GST Slab Rate Summary (GSTR-1 Ready)</h3>
                <p className="text-xs text-slate-500">
                  Detailed distribution of taxable sales, Central GST, State GST, and Integrated GST.
                </p>
              </div>
              <button
                onClick={() => handleExportCSV('GSTR1')}
                className="text-xs text-purple-700 hover:text-purple-800 font-semibold flex items-center gap-1 hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Export this table as CSV
              </button>
            </div>

            {report && report.taxRateBreakdown.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">GST Rate</th>
                      <th className="py-2.5 px-3 text-right">Taxable Value</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">IGST</th>
                      <th className="py-2.5 px-3 text-right">Total Tax</th>
                      <th className="py-2.5 px-3 text-right">Gross Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.taxRateBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                            {row.gstRate}% GST
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                          {formatCurrency(row.taxableAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(row.cgstAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(row.sgstAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(row.igstAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                          {formatCurrency(row.totalTax)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(row.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/70 border-t-2 border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td className="py-2.5 px-3 uppercase text-slate-700">Total</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(report.totalTaxable)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(report.totalCgst)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(report.totalSgst)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(report.totalIgst)}</td>
                      <td className="py-2.5 px-3 text-right text-purple-800">{formatCurrency(report.totalTax)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-900">{formatCurrency(report.totalInvoicedSales)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No tax transactions recorded for this period</p>
                <p className="text-xs text-slate-400 mt-1">Invoices issued within this date filter will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payment Methods Summary */}
        {activeTab === 'payments' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Payment Collection Breakdown</h3>
                <p className="text-xs text-slate-500">
                  Total revenue collected sorted by payment instrument.
                </p>
              </div>
            </div>

            {report && report.paymentBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.paymentBreakdown.map((pm, idx) => {
                  const getBadgeColor = (method: string) => {
                    switch (method) {
                      case 'CASH':
                        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      case 'UPI':
                        return 'bg-blue-50 text-blue-700 border-blue-200';
                      case 'CARD':
                        return 'bg-purple-50 text-purple-700 border-purple-200';
                      case 'BANK_TRANSFER':
                        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      default:
                        return 'bg-slate-50 text-slate-700 border-slate-200';
                    }
                  };

                  return (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 shadow-2xs bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeColor(pm.method)}`}>
                          {pm.method.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-600">{pm.percentage}%</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {formatCurrency(pm.amount)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                        <span>{pm.count} transactions</span>
                        <span className="text-slate-400">
                          Avg {pm.count > 0 ? formatCurrency(pm.amount / pm.count) : '₹0'}
                        </span>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, pm.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No payment records found for this period</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Top Selling Products */}
        {activeTab === 'products' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Top Selling Products & SKUs</h3>
                <p className="text-xs text-slate-500">
                  Products ranked by sales revenue and quantity sold during this period.
                </p>
              </div>
            </div>

            {report && report.topProducts.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Code / SKU</th>
                      <th className="py-2.5 px-3">HSN</th>
                      <th className="py-2.5 px-3 text-right">Units Sold</th>
                      <th className="py-2.5 px-3 text-right">Avg Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.topProducts.map((p, idx) => (
                      <tr key={p.productId || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{p.productName}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-2xs">{p.productCode}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-2xs">{p.hsnCode}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {p.unitsSold} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(p.avgPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(p.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No product sales records for this period</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Daily Sales Timeline */}
        {activeTab === 'timeline' && (
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daily Sales Ledger</h3>
                <p className="text-xs text-slate-500">
                  Chronological breakdown of sales activity and cash inflow per calendar date.
                </p>
              </div>
            </div>

            {report && report.dailyTimeline.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Bills Issued</th>
                      <th className="py-2.5 px-3 text-right">Invoiced Amount</th>
                      <th className="py-2.5 px-3 text-right">Collected Amount</th>
                      <th className="py-2.5 px-3 text-right">Uncollected / Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.dailyTimeline.map((item, idx) => {
                      const balance = item.totalSales - item.collected;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {new Date(item.date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                              {item.invoiceCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.totalSales)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                            {formatCurrency(item.collected)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {balance > 0 ? (
                              <span className="text-amber-600 font-bold">{formatCurrency(balance)}</span>
                            ) : (
                              <span className="text-slate-400">₹0.00</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No sales recorded on any date in this range</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Standard VND Tech Invoice & App Footer */}
      <div className="text-center py-4 text-2xs text-slate-400 border-t border-slate-200">
        <p className="font-semibold text-slate-500">Powered by VND Tech</p>
        <p>Billing Software | Business Technology Solutions</p>
        <p>Website: vndtech.in | Contact: 88255 08237</p>
      </div>
    </div>
  );
};
