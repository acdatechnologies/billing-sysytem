import React from 'react';
import { BarChart3, Download, Calendar, FileSpreadsheet } from 'lucide-react';

export const SalesReportsPage: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto my-12">
      <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
        <BarChart3 className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">Sales & Tax Reports</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        Scheduled for Phase 7: Daily, weekly, monthly and custom date range sales, GSTR-1 summaries, payment method breakdown, and Excel/CSV/PDF exports.
      </p>
    </div>
  );
};
