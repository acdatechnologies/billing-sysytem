import { getElectronAPI, restRequest } from './apiClient';
import { DashboardMetrics } from '../types';

export const dashboardApi = {
  // Get dashboard key KPIs and metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getDashboardMetrics();
    }
    return await restRequest<DashboardMetrics>('/dashboard/metrics');
  },
};
