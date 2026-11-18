import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  Users,
  Receipt,
  History,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { Customer, Invoice, WhatsAppLog, BusinessInfo } from '../types';

export const WhatsAppDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INVOICE_SHARE' | 'PROMO_BROADCAST' | 'LOGS'>('INVOICE_SHARE');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab 1 (Invoice Share) State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceCustomMessage, setInvoiceCustomMessage] = useState('');
  const [invoiceCustomerMobile, setInvoiceCustomerMobile] = useState('');

  // Tab 2 (Promotional Broadcast) State
  const [promoAudience, setPromoAudience] = useState<'OPTED_IN' | 'REPEAT' | 'RECENT_30' | 'ALL'>('OPTED_IN');
  const [promoMessageTemplate, setPromoMessageTemplate] = useState(
    'Hello [Customer Name],\n\nExciting new offers are waiting for you at [Business Name]! Visit our store this week to enjoy special discounts on all products.\n\nThank you for choosing us!\n[Business Name]\nContact: 88255 08237'
  );
  const [sentMessageIds, setSentMessageIds] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [invList, custList, biz, wLogs] = await Promise.all([
          window.electronAPI.getInvoices({ status: 'ACTIVE', limit: 50 }),
          window.electronAPI.getCustomers(),
          window.electronAPI.getBusinessInfo(),
          window.electronAPI.getWhatsAppLogs(50),
        ]);
        setInvoices(invList || []);
        setCustomers(custList || []);
        setBusinessInfo(biz || null);
        setLogs(wLogs || []);

        if (invList && invList.length > 0 && !selectedInvoiceId) {
          const first = invList[0];
          setSelectedInvoiceId(first.id);
          setInvoiceCustomerMobile(first.customer_mobile || '');
          buildInvoiceMessage(first, biz?.name || 'VND Tech Enterprises');
        }
      }
    } catch (err) {
      console.error('[WhatsAppDataPage] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedInvoiceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildInvoiceMessage = (inv: Invoice, bizName: string) => {
    const text = `Hello ${inv.customer_name},\n\nThank you for shopping with ${bizName}.\n\nYour invoice ${inv.invoice_number} for ₹${inv.grand_total.toFixed(2)} is ready.\n\nThank you for your business!\n${bizName}\nContact: 88255 08237`;
    setInvoiceCustomMessage(text);
  };

  const handleInvoiceSelect = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setInvoiceCustomerMobile(inv.customer_mobile || '');
      buildInvoiceMessage(inv, businessInfo?.name || 'VND Tech Enterprises');
    }
  };

  const handleSendInvoiceWhatsApp = async () => {
    if (!invoiceCustomerMobile) {
      alert('Please enter or verify the customer mobile number.');
      return;
    }
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    try {
      if (window.electronAPI) {
        await window.electronAPI.openWhatsApp({
          mobile: invoiceCustomerMobile,
          message: invoiceCustomMessage,
          customerId: inv?.customer_id,
          invoiceId: inv?.id,
        });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open WhatsApp');
    }
  };

  // Filter Audience for Promotional Messages
  const getFilteredPromoAudience = () => {
    switch (promoAudience) {
      case 'OPTED_IN':
        return customers.filter((c) => c.whatsapp_consent === 1);
      case 'REPEAT':
        return customers.filter((c) => c.whatsapp_consent === 1 && c.total_bills >= 2);
      case 'RECENT_30':
        return customers.filter((c) => c.whatsapp_consent === 1 && c.last_purchase_date);
      case 'ALL':
        return customers;
      default:
        return customers.filter((c) => c.whatsapp_consent === 1);
    }
  };

  const audienceList = getFilteredPromoAudience();

  const handleSendPromoToCustomer = async (c: Customer) => {
    const bizName = businessInfo?.name || 'VND Tech Enterprises';
    const personalizedMessage = promoMessageTemplate
      .replace(/\[Customer Name\]/g, c.name)
      .replace(/\[Business Name\]/g, bizName);

    try {
      if (window.electronAPI) {
        await window.electronAPI.openWhatsApp({
          mobile: c.mobile,
          message: personalizedMessage,
          customerId: c.id,
        });
        setSentMessageIds((prev) => ({ ...prev, [c.id]: true }));
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open WhatsApp');
    }
  };

  return (
    <div className="space-y-5">
      {/* Navigation Tabs Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('INVOICE_SHARE')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'INVOICE_SHARE'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Share Invoice</span>
          </button>

          <button
            onClick={() => setActiveTab('PROMO_BROADCAST')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'PROMO_BROADCAST'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Offers & Broadcasts</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'LOGS'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Message Log ({logs.length})</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          title="Refresh"
          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors ml-auto sm:ml-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Tab 1: Share Invoice on WhatsApp */}
      {activeTab === 'INVOICE_SHARE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Invoice Selection & Target Mobile */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              1. Select Invoice to Share
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Choose Recent Active Invoice
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    #{inv.invoice_number} &bull; {inv.customer_name} &bull; ₹{inv.grand_total.toFixed(2)} ({inv.invoice_date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Mobile Number (WhatsApp)
              </label>
              <input
                type="text"
                placeholder="10-digit mobile number"
                value={invoiceCustomerMobile}
                onChange={(e) => setInvoiceCustomerMobile(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Opens directly in WhatsApp Web or WhatsApp Desktop application
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSendInvoiceWhatsApp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp & Send Invoice</span>
              </button>
            </div>
          </div>

          {/* Right: Message Preview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                2. Prepared Message Text
              </h3>
              <span className="text-[10px] text-slate-400">Editable before sending</span>
            </div>

            <div>
              <textarea
                rows={9}
                value={invoiceCustomMessage}
                onChange={(e) => setInvoiceCustomMessage(e.target.value)}
                className="w-full p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl font-sans text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
              <strong className="text-slate-700">How this works:</strong> Clicking the green button triggers a direct WhatsApp deep link pre-filling this message for your customer. You can then also attach the saved invoice PDF directly inside WhatsApp.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Promotional Broadcasts */}
      {activeTab === 'PROMO_BROADCAST' && (
        <div className="space-y-5">
          {/* Audience Filter & Template Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filter Audience */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Select Target Audience
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPromoAudience('OPTED_IN')}
                  className={`w-full p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                    promoAudience === 'OPTED_IN'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold">Opted-in Customers</div>
                    <div className="text-[10px] text-slate-500">Active WhatsApp marketing consent</div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setPromoAudience('REPEAT')}
                  className={`w-full p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                    promoAudience === 'REPEAT'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold">Repeat Customers</div>
                    <div className="text-[10px] text-slate-500">2 or more previous bills</div>
                  </div>
                  <Receipt className="w-4 h-4 text-indigo-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setPromoAudience('RECENT_30')}
                  className={`w-full p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                    promoAudience === 'RECENT_30'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold">Recent Customers</div>
                    <div className="text-[10px] text-slate-500">Shopped with purchase records</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                Audience size: <strong className="text-slate-800">{audienceList.length}</strong> recipients
              </div>
            </div>

            {/* Template Message Composer */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Promotional Offer Template
                </h3>
                <span className="text-[10px] text-slate-400">Placeholders: [Customer Name], [Business Name]</span>
              </div>

              <textarea
                rows={6}
                value={promoMessageTemplate}
                onChange={(e) => setPromoMessageTemplate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              <div className="text-[10px] text-slate-500">
                <strong>Anti-Spam & Compliance Notice:</strong> Per requirements, promotional broadcasts must be shared manually with opted-in customers to respect WhatsApp policies and avoid business account suspensions.
              </div>
            </div>
          </div>

          {/* Recipient Audience List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800">
                Target Customer List ({audienceList.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Click "Send" next to each recipient to open WhatsApp
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Customer Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-center">Bills</th>
                    <th className="py-2.5 px-3 text-right">Spend</th>
                    <th className="py-2.5 px-3">Last Purchased</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {audienceList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No customers match this filter criteria.
                      </td>
                    </tr>
                  ) : (
                    audienceList.map((c) => {
                      const isSent = Boolean(sentMessageIds[c.id]);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                            {c.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {c.mobile}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                            {c.total_bills}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            ₹{c.total_purchases.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {c.last_purchase_date || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => handleSendPromoToCustomer(c)}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                isSent
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                            >
                              {isSent ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Opened</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  <span>Send Offer</span>
                                </>
                              )}
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
      )}

      {/* Tab 3: Message Dispatch Audit Log */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800">
              WhatsApp Message Dispatch History ({logs.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-4">Message Preview</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No WhatsApp messages logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                        {new Date(l.sent_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {l.customer_name || 'Customer'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {l.mobile}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                        {l.invoice_number || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs">
                        {l.message_text}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
