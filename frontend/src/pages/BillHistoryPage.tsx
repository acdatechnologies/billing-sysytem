import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Printer,
  Ban,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  IndianRupee,
  Eye,
  ChevronRight,
  ArrowLeft,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { Invoice } from '../types';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal';
import { invoiceApi } from '../api/invoiceApi';
import { whatsappApi } from '../api/whatsappApi';

export const BillHistoryPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'LIST' | 'DETAIL'
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');

  // Selected Invoice Detail State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Feedback banner
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const list = await invoiceApi.getInvoices({
        search: search.trim() || undefined,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        limit: 100,
      });
      setInvoices(list || []);
    } catch (err) {
      console.error('[BillHistoryPage] Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleOpenDetail = async (invoice: Invoice) => {
    try {
      const full = await invoiceApi.getInvoiceById(invoice.id);
      setSelectedInvoice(full || invoice);
      setShowCancelPrompt(false);
      setCancellationReason('');
      setView('DETAIL');
    } catch (err) {
      console.error(err);
      setSelectedInvoice(invoice);
      setView('DETAIL');
    }
  };

  const handleCancelInvoice = async (invoiceId: string, reason: string) => {
    if (!reason || !reason.trim()) {
      alert('Please provide a valid cancellation reason.');
      return;
    }
    try {
      await invoiceApi.cancelInvoice(invoiceId, reason.trim());
      setActionMessage('Invoice cancelled successfully. Sold stock has been restored to inventory.');
      setTimeout(() => setActionMessage(null), 5000);
      await fetchInvoices();
      setView('LIST');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    }
  };

  const handleShareWhatsApp = async (inv: Invoice) => {
    if (!inv.customer_mobile) {
      alert('This invoice does not have a customer mobile number.');
      return;
    }
    const bizName = inv.business?.name || 'VND Tech Enterprises';
    const message = `Hello ${inv.customer_name},\n\nThank you for shopping with ${bizName}.\n\nYour invoice #${inv.invoice_number} for ₹${inv.grand_total.toFixed(2)} is ready.\n\nThank you for your business!\n${bizName}\nContact: 88255 08237`;

    try {
      await whatsappApi.openWhatsApp({
        mobile: inv.customer_mobile,
        message,
        customerId: inv.customer_id,
        invoiceId: inv.id,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to open WhatsApp');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  // -------------------------------------------------------------
  // RENDER: BREADCRUMBS SUBVIEW FOR INVOICE DETAILS
  // -------------------------------------------------------------
  if (view === 'DETAIL' && selectedInvoice) {
    const isCancelled = selectedInvoice.status === 'CANCELLED';

    return (
      <div className="space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setView('LIST')}
              className="text-slate-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>Bill History</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Invoice #{selectedInvoice.invoice_number}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleShareWhatsApp(selectedInvoice)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Share WhatsApp
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg shadow-sm shadow-red-600/30 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>

            <button
              onClick={() => setView('LIST')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Invoices
            </button>
          </div>
        </div>

        {/* Invoice Header Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Invoice #{selectedInvoice.invoice_number}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border ${
                    isCancelled
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {selectedInvoice.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {selectedInvoice.payment_status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Issued on {selectedInvoice.invoice_date} at {selectedInvoice.invoice_time} | Paid via {selectedInvoice.payment_method}
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xs font-bold uppercase text-slate-400">Total Invoice Amount</span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {formatCurrency(selectedInvoice.grand_total)}
              </div>
            </div>
          </div>

          {/* Customer & Billing Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Billed To (Customer)</span>
              <div className="font-bold text-slate-800 text-sm">{selectedInvoice.customer_name}</div>
              {selectedInvoice.customer_mobile && (
                <div className="text-xs text-slate-600 mt-1 font-mono">Mobile: +91 {selectedInvoice.customer_mobile}</div>
              )}
              {selectedInvoice.customer_gstin && (
                <div className="text-xs text-slate-600 mt-0.5 font-mono">GSTIN: {selectedInvoice.customer_gstin}</div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Tax & Payment Reconciliation</span>
              <div className="flex justify-between text-xs text-slate-600 py-0.5">
                <span>Taxable Value:</span>
                <span className="font-mono font-medium">{formatCurrency(selectedInvoice.taxable_amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 py-0.5">
                <span>Total GST (CGST+SGST):</span>
                <span className="font-mono font-medium">
                  {formatCurrency((selectedInvoice.cgst_total || 0) + (selectedInvoice.sgst_total || 0) + (selectedInvoice.igst_total || 0))}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 py-0.5">
                <span>Amount Paid:</span>
                <span className="font-mono font-medium text-emerald-700">{formatCurrency(selectedInvoice.amount_received)}</span>
              </div>
              {selectedInvoice.balance_due > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-600 py-0.5">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.balance_due)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Item & Code</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-center">GST Rate</th>
                  <th className="py-2.5 px-3 text-right">Tax (₹)</th>
                  <th className="py-2.5 px-4 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedInvoice.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-800">{item.product_name}</div>
                      <div className="font-mono text-2xs text-slate-400">{item.product_code}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                      {item.quantity} {item.unit || 'PCS'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatCurrency(item.discount_amount || 0)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatCurrency(item.taxable_value)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-2xs">
                        {item.gst_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatCurrency((item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0))}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cancellation Section */}
        {!isCancelled && (
          <div className="bg-red-50/50 rounded-xl border border-red-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Bill Cancellation & Stock Reversal
                </h4>
                <p className="text-xs text-red-700 mt-1">
                  Cancelling will restore all item quantities back into available inventory and reverse financial totals.
                </p>
              </div>

              {!showCancelPrompt ? (
                <button
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors w-fit"
                >
                  Cancel Invoice
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    className="text-xs px-3 py-2 border border-red-300 rounded-lg bg-white focus:outline-none w-full sm:w-64"
                  />
                  <button
                    onClick={() => handleCancelInvoice(selectedInvoice.id, cancellationReason || 'Customer requested return')}
                    className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shrink-0"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300 shrink-0"
                  >
                    Abort
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Print Modal */}
        <PrintInvoiceModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          invoice={selectedInvoice}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: BILL HISTORY MAIN LIST VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-5 pb-12">
      {/* Toast */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Bills</option>
            <option value="CANCELLED">Cancelled Bills</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid Only</option>
            <option value="UNPAID">Unpaid Only</option>
          </select>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-3 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Customer Details</th>
                <th className="py-3 px-3 font-semibold text-center">Tax Type</th>
                <th className="py-3 px-3 font-semibold text-right">Taxable</th>
                <th className="py-3 px-3 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-3 font-semibold text-center">Payment</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No Invoices Found</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isCancelled = inv.status === 'CANCELLED';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-red-700">{inv.invoice_number}</td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{inv.invoice_date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.invoice_time}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{inv.customer_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.customer_mobile ? `+91 ${inv.customer_mobile}` : 'Walk-in Customer'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {inv.is_interstate ? 'IGST' : 'CGST+SGST'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {formatCurrency(inv.taxable_amount)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.grand_total)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            inv.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.payment_status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {inv.payment_status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCancelled
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
