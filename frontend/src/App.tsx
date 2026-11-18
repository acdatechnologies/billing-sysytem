import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { BillingPage } from './pages/BillingPage';
import { InventoryPage } from './pages/InventoryPage';
import { WhatsAppDataPage } from './pages/WhatsAppDataPage';
import { BillHistoryPage } from './pages/BillHistoryPage';
import { SalesReportsPage } from './pages/SalesReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NavigationTab, DashboardMetrics, BusinessInfo } from './types';

const defaultMetrics: DashboardMetrics = {
  todaySales: 0,
  todayBills: 0,
  totalProducts: 0,
  availableStock: 0,
  lowStockCount: 0,
  lowStockProducts: [],
  recentTransactions: [],
  monthlySales: [],
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network connectivity for offline/online indication
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch live metrics and business information from local SQLite
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (window.electronAPI) {
        const [dashMetrics, bizInfo] = await Promise.all([
          window.electronAPI.getDashboardMetrics(),
          window.electronAPI.getBusinessInfo(),
        ]);
        if (dashMetrics) setMetrics(dashMetrics);
        if (bizInfo) setBusinessInfo(bizInfo);
      }
    } catch (error) {
      console.error('[App] Failed to load data from SQLite:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard metrics={metrics} onNavigate={setActiveTab} />;
      case 'billing':
        return <BillingPage />;
      case 'products':
        return <ProductsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'customers':
        return <CustomersPage />;
      case 'whatsapp':
        return <WhatsAppDataPage />;
      case 'history':
        return <BillHistoryPage />;
      case 'reports':
        return <SalesReportsPage />;
      case 'settings':
        return <SettingsPage businessInfo={businessInfo} onRefresh={loadData} />;
      default:
        return <Dashboard metrics={metrics} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOnline={isOnline}
        lowStockCount={metrics.lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          activeTab={activeTab}
          businessInfo={businessInfo}
          onNewBill={() => setActiveTab('billing')}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderActivePage()}
        </main>

        {/* Standard Persistent Invoice / Application Footer */}
        <footer className="h-9 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Powered by VND Tech</span>
            <span className="text-slate-300">|</span>
            <span>Billing Software &bull; Business Technology Solutions</span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              Website:{' '}
              <a
                href="https://vndtech.in"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                vndtech.in
              </a>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Contact: <strong className="text-slate-700 font-mono">88255 08237</strong>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
