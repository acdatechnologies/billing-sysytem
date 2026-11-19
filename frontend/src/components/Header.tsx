import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Calendar, Clock, Store } from 'lucide-react';
import { NavigationTab, BusinessInfo } from '../types';

interface HeaderProps {
  activeTab: NavigationTab;
  businessInfo?: BusinessInfo;
  onNewBill: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  businessInfo,
  onNewBill,
  onRefresh,
  isRefreshing,
}) => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Business Dashboard', subtitle: 'Real-time sales, inventory & performance metrics' };
      case 'billing':
        return { title: 'New Billing & Invoice', subtitle: 'Fast POS, barcode scan & GST compliant invoicing' };
      case 'products':
        return { title: 'Product Catalog', subtitle: 'Manage product pricing, GST rates, codes and units' };
      case 'inventory':
        return { title: 'Inventory Management', subtitle: 'Track physical stock, adjustments & low stock alerts' };
      case 'customers':
        return { title: 'Customer Directory', subtitle: 'Customer profiles, purchase records & GST details' };
      case 'whatsapp':
        return { title: 'WhatsApp & Offers', subtitle: 'Share invoices and customer promotional broadcasts' };
      case 'history':
        return { title: 'Bill History', subtitle: 'Search, view, print, reprint or cancel past invoices' };
      case 'reports':
        return { title: 'Sales & Tax Reports', subtitle: 'In-depth financial reports, GST summaries & export' };
      case 'settings':
        return { title: 'Software Settings', subtitle: 'Store details, printer setup, cloud sync and backup' };
      default:
        return { title: 'VND Tech Billing', subtitle: 'Business Technology Solutions' };
    }
  };

  const { title, subtitle } = getPageTitle(activeTab);

  return (
    <header className="h-18 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs select-none flex-shrink-0">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Business Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
          <Store className="w-3.5 h-3.5 text-rose-600" />
          <span>{businessInfo?.name || 'VND Tech Enterprises'}</span>
          {businessInfo?.gstin && (
            <span className="text-[10px] text-slate-400 font-normal border-l border-slate-300 pl-2">
              GST: {businessInfo.gstin}
            </span>
          )}
        </div>

        {/* Date & Time */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-2 font-mono font-medium text-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{time}</span>
          </div>
        </div>

        {/* Quick Action: New Bill */}
        {activeTab !== 'billing' && (
          <button
            onClick={onNewBill}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 active:to-rose-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-red-600/25 transition-all duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Bill</span>
          </button>
        )}
      </div>
    </header>
  );
};
