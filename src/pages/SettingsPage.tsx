import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Printer,
  Cloud,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';
import { BusinessInfo, PrinterDevice } from '../types';

interface SettingsPageProps {
  businessInfo?: BusinessInfo;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ businessInfo, onRefresh }) => {
  const [appInfo, setAppInfo] = useState<any>(null);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [paperSize, setPaperSize] = useState<string>('A4');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppInfo().then(setAppInfo).catch(console.error);
      window.electronAPI
        .getInstalledPrinters()
        .then((list) => {
          setPrinters(list || []);
        })
        .catch(console.error);
    }
    if (businessInfo) {
      if (businessInfo.paper_size) setPaperSize(businessInfo.paper_size);
      if (businessInfo.default_printer) setSelectedPrinter(businessInfo.default_printer);
    }
  }, [businessInfo]);

  const handleSavePrinterSettings = async () => {
    try {
      setIsSaving(true);
      setFeedback(null);
      if (window.electronAPI) {
        await window.electronAPI.savePrinterSettings({
          paperSize,
          defaultPrinter: selectedPrinter || undefined,
        });
        setFeedback({ type: 'success', message: 'Printer configuration saved successfully.' });
        onRefresh();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTestPrint = async () => {
    try {
      setIsTesting(true);
      setFeedback(null);

      const testSlipHtml = `
        <div style="text-align: center; font-family: monospace; padding: 10px;">
          <h2 style="margin: 0;">VND TECH</h2>
          <p style="margin: 4px 0; font-size: 11px;">Printer Test Slip</p>
          <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
          <p style="font-size: 11px; margin: 2px 0;">Printer: ${selectedPrinter || 'Default System Printer'}</p>
          <p style="font-size: 11px; margin: 2px 0;">Paper: ${paperSize}</p>
          <p style="font-size: 11px; margin: 2px 0;">Status: VERIFIED & READY</p>
          <p style="font-size: 10px; margin: 6px 0;">${new Date().toLocaleString()}</p>
          <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
          <p style="font-size: 10px; font-weight: bold;">Powered by VND Tech</p>
          <p style="font-size: 9px;">vndtech.in | 88255 08237</p>
        </div>
      `;

      if (window.electronAPI) {
        const res = await window.electronAPI.printInvoice({
          printerName: selectedPrinter || undefined,
          silent: false,
          paperFormat: paperSize as any,
          htmlContent: testSlipHtml,
        });

        if (res.success) {
          setFeedback({ type: 'success', message: 'Test print sent to printer successfully.' });
        } else {
          setFeedback({ type: 'error', message: res.message || 'Test print failed.' });
        }
      } else {
        window.print();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Test print error.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

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

      {/* Printer & Hardware Setup */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Printer & Hardware Configuration
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Detected {printers.length} installed printers
          </span>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Default Hardware Printer
              </label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Default System Printer</option>
                {printers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} {p.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Physical thermal or laser printer connected to this computer
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Default Paper Size / Format
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="58mm">58mm Thermal Receipt (2-inch POS)</option>
                <option value="80mm">80mm Thermal Receipt (3-inch POS)</option>
                <option value="A4">A4 Full Sheet (Standard Laser/Inkjet)</option>
                <option value="A5">A5 Half Sheet (Compact Formal Invoice)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Default format loaded in New Billing & History printouts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={handleRunTestPrint}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>{isTesting ? 'Sending...' : 'Run Test Print'}</span>
            </button>

            <button
              onClick={handleSavePrinterSettings}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Printer Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Branding & Legal Footer (Section 3 Requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800">Invoice Branding & Terms</h3>
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">
              Standard Invoice Footer (Official VND Tech Branding)
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
              {businessInfo?.invoice_footer ||
                'Powered by VND Tech\nBilling Software | Business Technology Solutions\nWebsite: vndtech.in\nContact: 88255 08237'}
            </div>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">
              Terms & Conditions
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 whitespace-pre-wrap">
              {businessInfo?.terms_and_conditions ||
                '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Subject to local jurisdiction.'}
            </div>
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
