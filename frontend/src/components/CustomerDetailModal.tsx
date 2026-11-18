import React from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Receipt,
  MessageCircle,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Customer, Invoice } from '../types';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onViewInvoice: (invoiceId: string) => void;
  onSendWhatsApp: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onViewInvoice,
  onSendWhatsApp,
}) => {
  if (!isOpen || !customer) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">{customer.name}</h3>
              <p className="text-xs text-slate-500 font-mono">Mobile: {customer.mobile}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSendWhatsApp(customer)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Lifetime Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Total Purchases
              </span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(customer.total_purchases)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Total Invoices
              </span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {customer.total_bills} bills
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Last Purchased
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {customer.last_purchase_date || 'No purchases yet'}
              </div>
            </div>
          </div>

          {/* Profile Details Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Email Address</span>
                <span className="font-medium text-slate-800">{customer.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">GSTIN</span>
                <span className="font-mono font-medium text-slate-800">{customer.gstin || '—'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-slate-400 block text-[10px]">Registered Address</span>
              <span className="font-medium text-slate-800">{customer.address || '—'}</span>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-500">Marketing Consent:</span>
              {customer.whatsapp_consent === 1 ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Opted In
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                  <ShieldAlert className="w-3 h-3 text-slate-400" /> Opted Out
                </span>
              )}
            </div>
          </div>

          {/* Past Invoices History Table */}
          <div>
            <h4 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              Invoice Purchase History ({customer.invoices?.length || 0})
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!customer.invoices || customer.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No invoices generated for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    customer.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">
                          {inv.invoice_number}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {inv.invoice_date}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-semibold text-slate-700 uppercase">
                            {inv.payment_method}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(inv.grand_total)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => {
                              onClose();
                              onViewInvoice(inv.id);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
