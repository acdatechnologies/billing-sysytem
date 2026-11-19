import { getElectronAPI, restRequest } from './apiClient';
import { DashboardMetrics } from '../types';

export const dashboardApi = {
  // Get dashboard key KPIs and metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getDashboardMetrics();
    }
    try {
      const res = await restRequest<any>('/dashboard/metrics');
      const data = res?.data || res || {};
      return {
        todaySales: Number(data.todaySales) || 0,
        todayBills: Number(data.todayBills || data.todayInvoiceCount) || 0,
        totalProducts: Number(data.totalProducts) || 0,
        availableStock: Number(data.availableStock) || 0,
        lowStockCount: Number(data.lowStockCount) || 0,
        lowStockProducts: Array.isArray(data.lowStockProducts) ? data.lowStockProducts : [],
        recentTransactions: Array.isArray(data.recentTransactions)
          ? data.recentTransactions
          : (Array.isArray(data.recentInvoices) ? data.recentInvoices : []),
        monthlySales: Array.isArray(data.monthlySales)
          ? data.monthlySales
          : [
              {
                month: new Date().toLocaleDateString('en-US', { month: 'short' }),
                sales: Number(data.monthlySales) || 0,
                bills: Number(data.monthlyInvoiceCount) || 0,
              },
            ],
      };
    } catch (err) {
      console.error('[dashboardApi] Error fetching dashboard metrics:', err);
      return {
        todaySales: 0,
        todayBills: 0,
        totalProducts: 0,
        availableStock: 0,
        lowStockCount: 0,
        lowStockProducts: [],
        recentTransactions: [],
        monthlySales: [],
      };
    }
  },
};
