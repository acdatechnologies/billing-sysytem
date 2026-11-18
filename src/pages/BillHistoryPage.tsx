import React from 'react';
import { History, Search, FileText, Printer, XCircle } from 'lucide-react';

export const BillHistoryPage: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto my-12">
      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
        <History className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">Invoice History & Management</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        Scheduled for Phase 3: Search invoices by number, date or customer, view detailed line items, reprint thermal / A4 invoices, and execute safe bill cancellations with automatic stock restoration.
      </p>
    </div>
  );
};
