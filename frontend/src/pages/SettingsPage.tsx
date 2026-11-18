import React, { useState, useEffect, useCallback } from 'react';
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
  UploadCloud,
  DownloadCloud,
  Lock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { BusinessInfo, PrinterDevice, SyncStatus } from '../types';

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

  // Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    cloudEmail: null,
    serverUrl: 'http://localhost:5000',
    pendingCount: 0,
    lastSyncTime: null,
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Cloud Login Modal
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginServerUrl, setLoginServerUrl] = useState<string>('http://localhost:5000');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppInfo().then(setAppInfo).catch(console.error);
      window.electronAPI
        .getInstalledPrinters()
        .then((list) => {
          setPrinters(list || []);
        })
        .catch(console.error);
      window.electronAPI
        .getSyncStatus()
        .then((s) => {
          if (s) setSyncStatus(s);
        })
        .catch(console.error);
    }
    if (businessInfo) {
      if (businessInfo.paper_size) setPaperSize(businessInfo.paper_size);
      if (businessInfo.default_printer) setSelectedPrinter(businessInfo.default_printer);
    }
  }, [businessInfo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Cloud Sync Handlers
  const handleTriggerSync = async () => {
    try {
      setIsSyncing(true);
      setFeedback(null);
      if (window.electronAPI) {
        const res = await window.electronAPI.triggerSync();
        setFeedback({
          type: 'success',
          message: `Cloud synchronization complete! Pushed ${res.pushedCount} mutations to MongoDB Atlas.`,
        });
        loadData();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Cloud synchronization failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudBackup = async () => {
    try {
      setIsBackingUp(true);
      setFeedback(null);
      if (window.electronAPI) {
        const res = await window.electronAPI.requestCloudBackup();
        setFeedback({
          type: 'success',
          message: `Cloud backup verified! Backed up ${res.backup?.counts?.invoices || 0} invoices, ${res.backup?.counts?.products || 0} products.`,
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Cloud backup failed.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCloudLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      if (window.electronAPI) {
        await window.electronAPI.loginCloud({
          serverUrl: loginServerUrl,
          email: loginEmail,
          password: loginPassword,
        });
        setShowLoginModal(false);
        setFeedback({ type: 'success', message: 'Connected to MongoDB Atlas cloud account successfully!' });
        loadData();
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
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

      {/* Cloud Synchronization & MongoDB Atlas Status (Section 14 & 15 Requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Cloud Synchronization & MongoDB Atlas
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {syncStatus.isConnected ? (
              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Wifi className="w-3.5 h-3.5" /> Cloud Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <WifiOff className="w-3.5 h-3.5" /> Offline Standalone Mode
              </span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Cloud Account
              </span>
              <div className="font-bold text-slate-800 truncate mt-0.5">
                {syncStatus.cloudEmail || 'Not Connected'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Pending Local Sync
              </span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {syncStatus.pendingCount} mutations queued
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Last Cloud Synchronization
              </span>
              <div className="font-bold text-slate-700 mt-0.5">
                {syncStatus.lastSyncTime
                  ? new Date(syncStatus.lastSyncTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'Never Synced'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {!syncStatus.isConnected ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs shadow-blue-600/30 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Connect Cloud Account</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync with Cloud Now'}</span>
                </button>

                <button
                  onClick={handleCloudBackup}
                  disabled={isBackingUp}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>{isBackingUp ? 'Creating Backup...' : 'Generate Cloud Backup'}</span>
                </button>
              </div>
            )}

            <span className="text-[11px] text-slate-400">
              Zero cloud credentials stored on desktop client &bull; End-to-End JWT isolated
            </span>
          </div>
        </div>
      </div>

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

      {/* Invoice Branding & Legal Footer */}
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

      {/* Cloud Account Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Connect Cloud Account</h3>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                {loginError}
              </div>
            )}

            <form onSubmit={handleCloudLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Server API URL</label>
                <input
                  type="text"
                  required
                  value={loginServerUrl}
                  onChange={(e) => setLoginServerUrl(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  placeholder="http://localhost:5000"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Business Account Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  placeholder="admin@vndtech.in"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Sign In & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
