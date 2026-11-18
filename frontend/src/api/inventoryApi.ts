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
    if (electron) {
      return await electron.getInventorySummary();
    }
    return await restRequest<InventorySummary>('/inventory/summary');
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
