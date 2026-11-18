import { getElectronAPI, restRequest } from './apiClient';
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
  category_id?: string;
  categoryId?: string;
  unit?: string;
  purchase_price?: number;
  purchasePrice?: number;
  selling_price?: number;
  sellingPrice?: number;
  opening_stock?: number;
  current_stock?: number;
  currentStock?: number;
  minimum_stock?: number;
  minimumStock?: number;
  gst_rate?: number;
  gstRate?: number;
  hsn_code?: string;
  hsnCode?: string;
  is_active?: number;
  isActive?: number;
}

function formatProductPayload(input: any) {
  const sellingPrice = Number(input.selling_price ?? input.sellingPrice);
  const purchasePrice = Number(input.purchase_price ?? input.purchasePrice ?? 0);
  const currentStock = Number(input.current_stock ?? input.opening_stock ?? input.currentStock ?? 0);
  const minimumStock = Number(input.minimum_stock ?? input.minimumStock ?? 5);
  const gstRate = Number(input.gst_rate ?? input.gstRate ?? 18);

  return {
    ...input,
    name: input.name?.trim(),
    code: input.code?.trim().toUpperCase(),
    barcode: input.barcode?.trim() || '',
    unit: input.unit || 'PCS',
    selling_price: sellingPrice,
    sellingPrice,
    purchase_price: purchasePrice,
    purchasePrice,
    current_stock: currentStock,
    currentStock,
    opening_stock: currentStock,
    minimum_stock: minimumStock,
    minimumStock,
    gst_rate: gstRate,
    gstRate,
    category_id: input.category_id || input.categoryId || '',
    categoryId: input.category_id || input.categoryId || '',
    hsn_code: input.hsn_code || input.hsnCode || '',
    hsnCode: input.hsn_code || input.hsnCode || '',
  };
}

function formatProductResponse(p: any): Product {
  return {
    ...p,
    id: p.id || p.productId,
    business_id: p.business_id || p.businessId || 'default',
    name: p.name,
    code: p.code,
    barcode: p.barcode || '',
    unit: p.unit || 'PCS',
    selling_price: Number(p.selling_price ?? p.sellingPrice ?? 0),
    purchase_price: Number(p.purchase_price ?? p.purchasePrice ?? 0),
    current_stock: Number(p.current_stock ?? p.currentStock ?? 0),
    opening_stock: Number(p.opening_stock ?? p.currentStock ?? 0),
    minimum_stock: Number(p.minimum_stock ?? p.minimumStock ?? 5),
    gst_rate: Number(p.gst_rate ?? p.gstRate ?? 18),
    hsn_code: p.hsn_code ?? p.hsnCode ?? '',
    category_id: p.category_id ?? p.categoryId ?? '',
    category_name: p.category_name ?? p.categoryName ?? '',
    is_active: p.is_active !== undefined ? p.is_active : (p.isActive !== undefined ? p.isActive : 1),
  };
}

export const productApi = {
  // Get all products with optional filters
  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    const electron = getElectronAPI();
    if (electron) {
      const list = await electron.getProducts(filter);
      return Array.isArray(list) ? list.map(formatProductResponse) : [];
    }
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.categoryId) params.append('categoryId', filter.categoryId);
    if (filter?.stockStatus && filter.stockStatus !== 'ALL') {
      params.append('stockStatus', filter.stockStatus);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await restRequest<Product[]>(`/products${query}`);
    return Array.isArray(res) ? res.map(formatProductResponse) : [];
  },

  // Get a single product by ID
  async getProductById(id: string): Promise<Product | null> {
    const electron = getElectronAPI();
    if (electron) {
      const p = await electron.getProductById(id);
      return p ? formatProductResponse(p) : null;
    }
    const res = await restRequest<Product>(`/products/${id}`);
    return res ? formatProductResponse(res) : null;
  },

  // Create new product
  async createProduct(input: ProductInput): Promise<Product> {
    const payload = formatProductPayload(input);
    const electron = getElectronAPI();
    if (electron) {
      const created = await electron.createProduct(payload);
      return formatProductResponse(created);
    }
    const res = await restRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return formatProductResponse(res);
  },

  // Update existing product
  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    const payload = formatProductPayload(input);
    const electron = getElectronAPI();
    if (electron) {
      const updated = await electron.updateProduct(id, payload);
      return formatProductResponse(updated);
    }
    const res = await restRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return formatProductResponse(res);
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
