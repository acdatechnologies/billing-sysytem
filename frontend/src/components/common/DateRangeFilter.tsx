import React, { useState } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';

export interface DateRangeFilterProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange,
  onClear,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to format Date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const applyPreset = (preset: 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL') => {
    const today = new Date();
    if (preset === 'ALL') {
      onChange('', '');
      if (onClear) onClear();
    } else if (preset === 'TODAY') {
      const d = formatDate(today);
      onChange(d, d);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      const d = formatDate(yest);
      onChange(d, d);
    } else if (preset === 'LAST_7') {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      onChange(formatDate(past), formatDate(today));
    } else if (preset === 'THIS_MONTH') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      onChange(formatDate(start), formatDate(today));
    }
    setIsOpen(false);
  };

  const hasFilter = Boolean(startDate || endDate);

  const formatDisplay = () => {
    if (!startDate && !endDate) return 'All Dates';
    if (startDate && endDate) {
      if (startDate === endDate) return startDate;
      return `${startDate} → ${endDate}`;
    }
    if (startDate) return `From ${startDate}`;
    return `Up to ${endDate}`;
  };

  return (
    <div className={`relative inline-block text-xs ${className}`}>
      <div className="flex items-center gap-1.5">
        {/* Main Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
            hasFilter
              ? 'bg-red-50 border-red-300 text-red-700 font-semibold shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
          }`}
        >
          <Calendar className={`w-3.5 h-3.5 ${hasFilter ? 'text-red-600' : 'text-slate-400'}`} />
          <span>{formatDisplay()}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Clear Filter Button */}
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              onChange('', '');
              if (onClear) onClear();
            }}
            title="Clear Date Filter"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-30 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quick Filter
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => applyPreset('ALL')}
                className="px-2.5 py-1.5 text-left rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                All Dates
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TODAY')}
                className="px-2.5 py-1.5 text-left rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPreset('YESTERDAY')}
                className="px-2.5 py-1.5 text-left rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => applyPreset('LAST_7')}
                className="px-2.5 py-1.5 text-left rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset('THIS_MONTH')}
                className="col-span-2 px-2.5 py-1.5 text-left rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                This Month
              </button>
            </div>

            <div className="border-t border-slate-100 pt-2.5 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Custom Range
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onChange(e.target.value, endDate)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onChange(startDate, e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange('', '');
                    setIsOpen(false);
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-medium"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-md font-semibold shadow-xs"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
