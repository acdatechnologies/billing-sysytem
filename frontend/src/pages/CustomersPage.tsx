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
  ChevronRight,
  ArrowLeft,
  Save,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Customer, CustomerInput } from '../types';
import { customerApi } from '../api/customerApi';
import { whatsappApi } from '../api/whatsappApi';
import { validateCustomer } from '../utils/validators';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'LIST' | 'FORM' | 'DETAIL'
  const [view, setView] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');

  // Filters
  const [search, setSearch] = useState('');
  const [consentOnly, setConsentOnly] = useState(false);
  const [repeatOnly, setRepeatOnly] = useState(false);

  // Form State
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    mobile: '',
    email: '',
    address: '',
    gstin: '',
    state: 'Tamil Nadu',
    state_code: '33',
    whatsapp_consent: 1,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail View State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteConfirmCust, setDeleteConfirmCust] = useState<Customer | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const list = await customerApi.getCustomers({
        search: search.trim() || undefined,
        hasOutstanding: repeatOnly ? true : undefined,
      });
      setCustomers(list || []);
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
    setFormData({
      name: '',
      mobile: '',
      email: '',
      address: '',
      gstin: '',
      state: 'Tamil Nadu',
      state_code: '33',
      whatsapp_consent: 1,
    });
    setFormError(null);
    setView('FORM');
  };

  const handleOpenEdit = (c: Customer) => {
    setCustomerToEdit(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email || '',
      address: c.address || '',
      gstin: c.gstin || '',
      state: c.state || 'Tamil Nadu',
      state_code: c.state_code || '33',
      whatsapp_consent: c.whatsapp_consent !== undefined ? c.whatsapp_consent : 1,
    });
    setFormError(null);
    setView('FORM');
  };

  const handleOpenDetail = async (c: Customer) => {
    try {
      const full = await customerApi.getCustomerById(c.id);
      setSelectedCustomer(full || c);
      setView('DETAIL');
    } catch (e) {
      setSelectedCustomer(c);
      setView('DETAIL');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateCustomer({
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      gstin: formData.gstin,
    });

    if (!validation.isValid) {
      setFormError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      if (customerToEdit) {
        await customerApi.updateCustomer(customerToEdit.id, formData);
        setFeedbackMessage(`Customer "${formData.name}" updated successfully!`);
      } else {
        await customerApi.createCustomer(formData);
        setFeedbackMessage(`Customer "${formData.name}" registered successfully!`);
      }
      await fetchCustomers();
      setView('LIST');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      console.error('[CustomerForm] Save error:', err);
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = async (c: Customer) => {
    const defaultMsg = `Hello ${c.name},\n\nThank you for shopping with VND Tech Enterprises.\n\nWe value your partnership and look forward to serving you again!\n\nVND Tech Enterprises\nContact: 88255 08237`;
    try {
      await whatsappApi.openWhatsApp({
        mobile: c.mobile,
        message: defaultMsg,
        customerId: c.id,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to open WhatsApp');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirmCust) return;
    try {
      await customerApi.deleteCustomer(deleteConfirmCust.id);
      setFeedbackMessage('Customer removed successfully.');
      setTimeout(() => setFeedbackMessage(null), 4000);
      fetchCustomers();
      if (view === 'DETAIL') setView('LIST');
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

  // -------------------------------------------------------------
  // RENDER: BREADCRUMBS SUBVIEW FOR ADD / EDIT CUSTOMER
  // -------------------------------------------------------------
  if (view === 'FORM') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setView('LIST')}
              className="text-slate-500 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors"
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Customers</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {customerToEdit ? `Edit: ${customerToEdit.name}` : 'Register New Customer'}
            </span>
          </div>

          <button
            onClick={() => setView('LIST')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Customer Directory
          </button>
        </div>

        {/* Full-Page Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {customerToEdit ? `Edit Customer Details` : 'Customer Information'}
              </h2>
              <p className="text-xs text-slate-500">
                Provide accurate mobile number for WhatsApp invoice delivery and automatic ledger tracking.
              </p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Senthil Kumar"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit mobile"
                    className="w-full text-xs pl-12 pr-3.5 py-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Used for duplicate matching and WhatsApp PDF sharing</span>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer GSTIN <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Billing Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Door No, Street name, City, Pincode"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>
            </div>

            {/* WhatsApp Consent Box */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.whatsapp_consent === 1}
                  onChange={(e) => setFormData({ ...formData, whatsapp_consent: e.target.checked ? 1 : 0 })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    WhatsApp Invoice & Promotional Consent
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Customer has agreed to receive instant digital invoice PDFs and exclusive promotional offers directly on WhatsApp.
                  </p>
                </div>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setView('LIST')}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: BREADCRUMBS SUBVIEW FOR CUSTOMER PROFILE & INVOICES
  // -------------------------------------------------------------
  if (view === 'DETAIL' && selectedCustomer) {
    return (
      <div className="space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setView('LIST')}
              className="text-slate-500 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors"
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span>Customers</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {selectedCustomer.name} (Profile)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(selectedCustomer)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>

            <button
              onClick={() => setView('LIST')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Directory
            </button>
          </div>
        </div>

        {/* Customer Profile Header Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 font-bold text-xl flex items-center justify-center border border-purple-200">
                {selectedCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                  {selectedCustomer.whatsapp_consent === 1 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> WhatsApp Opted In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      No Consent
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    +91 {selectedCustomer.mobile}
                  </span>
                  {selectedCustomer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCustomer.email}
                    </span>
                  )}
                  {selectedCustomer.gstin && (
                    <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                      GSTIN: {selectedCustomer.gstin}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSendWhatsApp(selectedCustomer)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors w-fit"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Purchase Value</span>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(selectedCustomer.total_purchases)}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Invoices Issued</span>
              <div className="text-lg font-bold text-purple-700 font-mono mt-0.5">
                {selectedCustomer.total_bills} Bills
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Last Purchase Date</span>
              <div className="text-sm font-semibold text-slate-700 mt-1">
                {selectedCustomer.last_purchase_date
                  ? new Date(selectedCustomer.last_purchase_date).toLocaleDateString('en-IN')
                  : 'No transactions yet'}
              </div>
            </div>
          </div>
        </div>

        {/* Purchase History Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Purchase History Ledger</h3>
            </div>
          </div>

          {selectedCustomer.invoices && selectedCustomer.invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Taxable</th>
                    <th className="py-2.5 px-4 text-right">Tax</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCustomer.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-purple-700">{inv.invoice_number}</td>
                      <td className="py-2.5 px-4 text-slate-600">{inv.invoice_date}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(inv.taxable_amount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency((inv.cgst_total || 0) + (inv.sgst_total || 0) + (inv.igst_total || 0))}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-2xs font-bold ${
                            inv.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">No invoices have been billed to this customer yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: CUSTOMERS MAIN DIRECTORY VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-5 pb-12">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Customers</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">{totalCustomers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">WhatsApp Opted-In</span>
            <div className="text-xl font-bold text-emerald-600 font-mono mt-0.5">{optedInCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Repeat Shoppers</span>
            <div className="text-xl font-bold text-blue-600 font-mono mt-0.5">{repeatShoppersCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Purchases</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">
              {formatCurrency(totalPurchasesVolume)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, 10-digit mobile, or GSTIN..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setConsentOnly(!consentOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              consentOnly
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            WhatsApp Opt-In
          </button>

          <button
            onClick={() => setRepeatOnly(!repeatOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              repeatOnly
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Repeat Customers
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading customer directory...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">No customers found</p>
            <button onClick={handleOpenAdd} className="mt-2 text-xs text-purple-600 hover:underline">
              Add your first customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Mobile Number</th>
                  <th className="py-2.5 px-4">GSTIN</th>
                  <th className="py-2.5 px-4 text-center">Bills</th>
                  <th className="py-2.5 px-4 text-right">Total Purchases</th>
                  <th className="py-2.5 px-4 text-center">WhatsApp</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-800">{c.name}</div>
                      {c.address && <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</div>}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">+91 {c.mobile}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {c.gstin ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-2xs">{c.gstin}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700">
                        {c.total_bills}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(c.total_purchases)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {c.whatsapp_consent === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Opted In
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                          title="View Profile & Invoices"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(c)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmCust(c)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert */}
      {deleteConfirmCust && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Are you sure you want to remove customer <strong>"{deleteConfirmCust.name}"</strong>?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteConfirmCust(null)}
              className="px-3 py-1 text-xs bg-white text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCustomer}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
