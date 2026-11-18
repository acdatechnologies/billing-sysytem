import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Receipt,
  MessageCircle,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  IndianRupee,
  Sparkles,
} from 'lucide-react';
import { Customer } from '../types';
import { CustomerModal } from '../components/CustomerModal';
import { CustomerDetailModal } from '../components/CustomerDetailModal';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [consentOnly, setConsentOnly] = useState(false);
  const [repeatOnly, setRepeatOnly] = useState(false);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [deleteConfirmCust, setDeleteConfirmCust] = useState<Customer | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const list = await window.electronAPI.getCustomers({
          search: search.trim() || undefined,
          consentOnly: consentOnly ? true : undefined,
          repeatOnly: repeatOnly ? true : undefined,
        });
        setCustomers(list || []);
      }
    } catch (err) {
      console.error('[CustomersPage] Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, consentOnly, repeatOnly]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenAdd = () => {
    setCustomerToEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setCustomerToEdit(c);
    setIsCustomerModalOpen(true);
  };

  const handleOpenDetail = async (c: Customer) => {
    try {
      if (window.electronAPI) {
        const full = await window.electronAPI.getCustomerById(c.id);
        setSelectedCustomer(full || c);
      } else {
        setSelectedCustomer(c);
      }
      setIsDetailModalOpen(true);
    } catch (e) {
      setSelectedCustomer(c);
      setIsDetailModalOpen(true);
    }
  };

  const handleOpenInvoiceFromCustomer = async (invoiceId: string) => {
    try {
      if (window.electronAPI) {
        const inv = await window.electronAPI.getInvoiceById(invoiceId);
        if (inv) {
          setSelectedInvoice(inv);
          setIsInvoiceModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendWhatsApp = async (c: Customer) => {
    const defaultMsg = `Hello ${c.name},\n\nThank you for shopping with VND Tech Enterprises.\n\nWe value your partnership and look forward to serving you again!\n\nVND Tech Enterprises\nContact: 88255 08237`;
    try {
      if (window.electronAPI) {
        await window.electronAPI.openWhatsApp({
          mobile: c.mobile,
          message: defaultMsg,
          customerId: c.id,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open WhatsApp');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirmCust) return;
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteCustomer(deleteConfirmCust.id);
        setFeedbackMessage('Customer removed successfully.');
        setTimeout(() => setFeedbackMessage(null), 4000);
        fetchCustomers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    } finally {
      setDeleteConfirmCust(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  // KPI Calculations
  const totalCustomers = customers.length;
  const optedInCount = customers.filter((c) => c.whatsapp_consent === 1).length;
  const repeatShoppersCount = customers.filter((c) => c.total_bills >= 2).length;
  const totalPurchasesVolume = customers.reduce((sum, c) => sum + (c.total_purchases || 0), 0);

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Customers</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">{totalCustomers}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">WhatsApp Opted-In</span>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{optedInCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Repeat Shoppers</span>
            <div className="text-xl font-bold text-indigo-700 font-mono mt-0.5">{repeatShoppersCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Customer Spend</span>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              {formatCurrency(totalPurchasesVolume)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, 10-digit mobile, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>

        {/* Filter Chips & Add Customer */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setConsentOnly(!consentOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${consentOnly
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
          >
            WhatsApp Opted-In Only
          </button>

          <button
            onClick={() => setRepeatOnly(!repeatOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${repeatOnly
              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
          >
            Repeat Buyers (2+ Bills)
          </button>

          <button
            onClick={fetchCustomers}
            title="Refresh"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 animate-in fade-in">
          {feedbackMessage}
        </div>
      )}

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-3">Contact Number</th>
                <th className="py-3 px-3">GSTIN</th>
                <th className="py-3 px-3 text-center">Bills</th>
                <th className="py-3 px-3 text-right">Total Purchases</th>
                <th className="py-3 px-3">Last Purchased</th>
                <th className="py-3 px-3 text-center">Consent</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No Customers Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try clearing your search query.' : 'Click "Add Customer" or generate a bill to save customer records.'}
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{c.name}</div>
                      {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                    </td>

                    {/* Mobile */}
                    <td className="py-3 px-3 font-mono">
                      <span className="font-bold text-slate-700">{c.mobile}</span>
                    </td>

                    {/* GSTIN */}
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {c.gstin ? (
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                          {c.gstin}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Bills Count */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                        {c.total_bills}
                      </span>
                    </td>

                    {/* Total Purchases */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(c.total_purchases)}
                    </td>

                    {/* Last Purchased */}
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {c.last_purchase_date || '—'}
                    </td>

                    {/* WhatsApp Consent */}
                    <td className="py-3 px-3 text-center">
                      {c.whatsapp_consent === 1 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Opted In
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                          Opted Out
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSendWhatsApp(c)}
                          title="Open WhatsApp Chat"
                          className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDetail(c)}
                          title="View Profile & Invoices"
                          className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmCust(c)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmCust && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-sm text-slate-800 mb-2">Delete Customer Record</h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to remove <strong>{deleteConfirmCust.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => setDeleteConfirmCust(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal (Add/Edit) */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaved={fetchCustomers}
        customerToEdit={customerToEdit}
      />

      {/* Customer Detail & History Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        customer={selectedCustomer}
        onViewInvoice={handleOpenInvoiceFromCustomer}
        onSendWhatsApp={handleSendWhatsApp}
      />

      {/* Invoice Detail Modal for cross-navigation */}
      <InvoiceDetailModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
