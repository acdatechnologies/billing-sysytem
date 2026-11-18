import React, { useState, useEffect } from 'react';
import { Settings, Building, Printer, Cloud, Shield, Save, Check } from 'lucide-react';
import { BusinessInfo } from '../types';

interface SettingsPageProps {
  businessInfo?: BusinessInfo;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ businessInfo, onRefresh }) => {
  const [appInfo, setAppInfo] = useState<any>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppInfo().then(setAppInfo).catch(console.error);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Business Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800">Business Profile</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">Business Name</label>
            <input
              type="text"
              readOnly
              value={businessInfo?.name || 'VND Tech Enterprises'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">GSTIN</label>
            <input
              type="text"
              readOnly
              value={businessInfo?.gstin || '33AAAAA0000A1Z5'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">Contact Phone</label>
            <input
              type="text"
              readOnly
              value={businessInfo?.phone || '88255 08237'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">Email</label>
            <input
              type="text"
              readOnly
              value={businessInfo?.email || 'contact@vndtech.in'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-slate-500 font-medium block mb-1">Registered Address</label>
            <input
              type="text"
              readOnly
              value={businessInfo?.address || 'Tech Park Road, Coimbatore, Tamil Nadu, 641001'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Invoice & Printer Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <Printer className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800">Invoice & Thermal Printing Configuration</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">Invoice Prefix</label>
            <input
              type="text"
              readOnly
              value={businessInfo?.invoice_prefix || 'VND-'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">Default GST Rate</label>
            <input
              type="text"
              readOnly
              value={`${businessInfo?.default_gst_rate || 18}%`}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-slate-500 font-medium block mb-1">Standard Paper Format</label>
            <input
              type="text"
              readOnly
              value={businessInfo?.paper_size || 'A4 (Standard)'}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>
        <div className="px-5 pb-5 text-xs">
          <label className="text-slate-500 font-medium block mb-1">Standard Invoice Footer (Branding)</label>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
            {businessInfo?.invoice_footer ||
              'Powered by VND Tech\nBilling Software | Business Technology Solutions\nWebsite: vndtech.in\nContact: 88255 08237'}
          </div>
        </div>
      </div>

      {/* Database & System Diagnosis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-800">Local Database & System Health</h3>
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Local Database Engine:</span>
            <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              SQLite (WAL Mode Enabled)
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Database File Location:</span>
            <span className="font-mono text-[11px] text-slate-700 max-w-md truncate" title={appInfo?.databasePath}>
              {appInfo?.databasePath || 'Loading path...'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Desktop Environment:</span>
            <span className="text-slate-700">
              Electron v34.2 | Node v22.15 | React v19
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">App Version:</span>
            <span className="font-semibold text-slate-800">
              v{appInfo?.version || '1.0.0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
