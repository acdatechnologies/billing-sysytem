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
} from 'lucide-react';
import { Invoice } from '../types';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';

export const BillHistoryPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');

  // Selected Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Feedback banner
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const list = await window.electronAPI.getInvoices({
          search: search.trim() || undefined,
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          limit: 100,
        });
        setInvoices(list || []);
      }
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
      if (window.electronAPI) {
        const full = await window.electronAPI.getInvoiceById(invoice.id);
        setSelectedInvoice(full || invoice);
      } else {
        setSelectedInvoice(invoice);
      }
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error(err);
      setSelectedInvoice(invoice);
      setIsDetailModalOpen(true);
    }
  };

  const handleCancelInvoice = async (invoiceId: string, reason: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.cancelInvoice(invoiceId, reason);
        setActionMessage('Invoice cancelled successfully. Sold stock has been restored to inventory.');
        setTimeout(() => setActionMessage(null), 5000);
        fetchInvoices();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-5">
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
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Bills</option>
            <option value="CANCELLED">Cancelled Bills</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchInvoices}
            title="Refresh Invoices"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No Invoices Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try clearing your search query.' : 'Bills finalized in New Billing will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isCancelled = inv.status === 'CANCELLED';
                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCancelled ? 'bg-red-50/20 opacity-80' : ''
                      }`}
                    >
                      {/* Invoice # */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {inv.invoice_number}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3 text-slate-600">
                        <div>{inv.invoice_date}</div>
                        <div className="text-[10px] text-slate-400">{inv.invoice_time}</div>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {inv.customer_name}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {inv.customer_mobile || '—'}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 uppercase text-[10px] block">
                          {inv.payment_method}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            inv.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : inv.payment_status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {inv.payment_status}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-700 border border-red-200">
                            CANCELLED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.grand_total)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(inv)}
                            title="View / Print Invoice"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-[11px] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        invoice={selectedInvoice}
        onCancelInvoice={handleCancelInvoice}
      />
    </div>
  );
};
