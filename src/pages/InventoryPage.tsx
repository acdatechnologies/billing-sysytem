import React from 'react';
import { Boxes, AlertTriangle, ArrowUpDown, History } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto my-12">
      <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-100">
        <Boxes className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">Inventory & Stock Movements</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        Scheduled for Phase 2: Stock adjustments, low stock notifications, intake purchase entries, and complete stock movement audit trails.
      </p>
    </div>
  );
};
