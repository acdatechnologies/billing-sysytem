import { getElectronAPI, restRequest } from './apiClient';
import { InventorySummary, StockMovement } from '../types';

export interface StockAdjustmentInput {
  productId: string;
  movementType: 'IN' | 'OUT' | 'DAMAGE' | 'AUDIT_CORRECTION';
  quantity: number;
  reason: string;
  notes?: string;
}

export const inventoryApi = {
  // Get inventory metrics summary
  async getInventorySummary(): Promise<InventorySummary> {
    const electron = getElectronAPI();
    let raw: any = null;
    if (electron) {
      raw = await electron.getInventorySummary();
    } else {
      const res = await restRequest<any>('/inventory/summary');
      raw = res?.data !== undefined ? res.data : res;
    }

    return {
      totalSkus: Number(raw?.totalSkus ?? raw?.totalProducts ?? 0) || 0,
      totalUnits: Number(raw?.totalUnits ?? raw?.totalStockUnits ?? 0) || 0,
      totalCostValuation: Number(raw?.totalCostValuation ?? raw?.totalStockValue ?? 0) || 0,
      totalRetailValuation: Number(raw?.totalRetailValuation ?? raw?.totalStockRetailValue ?? 0) || 0,
      lowStockCount: Number(raw?.lowStockCount ?? 0) || 0,
      outOfStockCount: Number(raw?.outOfStockCount ?? 0) || 0,
    };
  },

  // Get stock audit movements
  async getStockMovements(productId?: string, limit?: number): Promise<StockMovement[]> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getStockMovements(productId, limit);
    }
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return await restRequest<StockMovement[]>(`/inventory/movements${query}`);
  },

  // Adjust stock
  async adjustStock(input: StockAdjustmentInput): Promise<boolean> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.adjustStock(input);
    }
    await restRequest('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return true;
  },
};
