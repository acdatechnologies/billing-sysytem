import React from 'react';
import { Receipt, Search, ShoppingCart, User, Percent, CreditCard, Printer, CheckCircle } from 'lucide-react';

export const BillingPage: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto my-12">
      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
        <Receipt className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">New Billing & POS Terminal</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        Phase 1 Foundation is currently active. The full Billing module with barcode scanning, multi-product line items, GST slab engine (0%, 5%, 12%, 18%, 28%), discounts and decimal arithmetic is scheduled for Phase 3.
      </p>

      <div className="grid grid-cols-3 gap-3 mt-8 text-left">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="font-semibold text-xs text-slate-700 flex items-center gap-1.5 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> GST Calculation
          </div>
          <p className="text-[11px] text-slate-400">Intra & Inter-state auto detection</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="font-semibold text-xs text-slate-700 flex items-center gap-1.5 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Stock Sync
          </div>
          <p className="text-[11px] text-slate-400">Automatic stock deduction</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="font-semibold text-xs text-slate-700 flex items-center gap-1.5 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Multi-Payment
          </div>
          <p className="text-[11px] text-slate-400">Cash, UPI, Card & Split</p>
        </div>
      </div>
    </div>
  );
};
