import { getElectronAPI, isElectron, restRequest } from './apiClient';
import { Product, ProductCategory } from '../types';

export interface ProductFilter {
  search?: string;
  categoryId?: string;
  stockStatus?: 'ALL' | 'HEALTHY' | 'LOW' | 'OUT';
}

export interface ProductInput {
  name: string;
  code: string;
  barcode?: string;
  categoryId?: string;
  category_id?: string;
  unit?: string;
  purchasePrice?: number;
  purchase_price?: number;
  sellingPrice?: number;
  selling_price?: number;
  openingStock?: number;
  opening_stock?: number;
  currentStock?: number;
  current_stock?: number;
  minimumStock?: number;
  minimum_stock?: number;
  gstRate?: number;
  gst_rate?: number;
  hsnCode?: string;
  hsn_code?: string;
  isActive?: number;
  is_active?: number;
}

export const productApi = {
  // Get all products with optional filters
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getProducts(filter);
    }
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.categoryId) params.append('categoryId', filter.categoryId);
    if (filter?.stockStatus && filter.stockStatus !== 'ALL') {
      params.append('stockStatus', filter.stockStatus);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return await restRequest<Product[]>(`/products${query}`);
  },

  // Get a single product by ID
  async getProductById(id: string): Promise<Product | null> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getProductById(id);
    }
    return await restRequest<Product>(`/products/${id}`);
  },

  // Create new product
  async createProduct(input: ProductInput): Promise<Product> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.createProduct(input);
    }
    return await restRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Update existing product
  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.updateProduct(id, input);
    }
    return await restRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  // Delete product
  async deleteProduct(id: string): Promise<boolean> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.deleteProduct(id);
    }
    await restRequest(`/products/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // List all categories
  async getCategories(): Promise<ProductCategory[]> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getCategories();
    }
    return await restRequest<ProductCategory[]>('/products/categories');
  },

  // Create new category
  async createCategory(name: string, description?: string): Promise<ProductCategory> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.createCategory(name, description);
    }
    return await restRequest<ProductCategory>('/products/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },
};
