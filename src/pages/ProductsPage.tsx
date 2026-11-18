import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Boxes,
  AlertTriangle,
  CheckCircle,
  Tag,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductModal } from '../components/ProductModal';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW' | 'OUT'>('ALL');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [prodList, catList] = await Promise.all([
          window.electronAPI.getProducts({
            search: search.trim() || undefined,
            categoryId: selectedCategory || undefined,
            stockStatus: stockFilter,
          }),
          window.electronAPI.getCategories(),
        ]);
        setProducts(prodList || []);
        setCategories(catList || []);
      }
    } catch (err) {
      console.error('[ProductsPage] Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, stockFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleOpenAdjustmentModal = (product: Product) => {
    setProductToAdjust(product);
    setIsAdjustmentModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.deleteProduct(deleteConfirmProduct.id);
        setDeleteMessage(res.message);
        setTimeout(() => setDeleteMessage(null), 4000);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setDeleteConfirmProduct(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-5">
      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, barcode, HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>

        {/* Category & Stock Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="HEALTHY">In Stock (Healthy)</option>
            <option value="LOW">Low Stock Warning</option>
            <option value="OUT">Out of Stock (0 or less)</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchData}
            title="Refresh Products"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs shadow-blue-600/30 transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Info message banner */}
      {deleteMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-800 animate-in fade-in">
          {deleteMessage}
        </div>
      )}

      {/* Products Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Product Name</th>
                <th className="py-3 px-3 font-semibold">Code / Barcode</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold text-right">Cost (₹)</th>
                <th className="py-3 px-3 font-semibold text-right">Selling Price (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">GST Slab</th>
                <th className="py-3 px-3 font-semibold text-right">Current Stock</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No Products Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try clearing your search filter.' : 'Click "Add Product" to create your first item.'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const isOutOfStock = item.current_stock <= 0;
                  const isLowStock = item.current_stock <= item.minimum_stock && !isOutOfStock;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Unit */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Unit: <strong className="text-slate-600">{item.unit}</strong>{' '}
                          {item.hsn_code ? `| HSN: ${item.hsn_code}` : ''}
                        </div>
                      </td>

                      {/* Code / Barcode */}
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-slate-700">{item.code}</span>
                        {item.barcode && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <QrCode className="w-2.5 h-2.5" />
                            <span>{item.barcode}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          {item.category_name || 'General'}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 text-right text-slate-500 font-medium">
                        {formatCurrency(item.purchase_price)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(item.selling_price)}
                      </td>

                      {/* GST Rate */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {item.gst_rate}%
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              isOutOfStock
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.current_stock} {item.unit}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Min: {item.minimum_stock}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustmentModal(item)}
                            title="Adjust Stock Quantity"
                            className="p-1.5 rounded-lg text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmProduct(item)}
                            title="Delete / Deactivate"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete / Deactivate Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Confirm Deletion</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove <strong>{deleteConfirmProduct.name}</strong>?
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Note: If this product has ever been billed in an invoice, it will be automatically deactivated rather than purged, protecting your tax audit trail.
            </p>
            <div className="flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSaved={fetchData}
        productToEdit={productToEdit}
        categories={categories}
        onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSaved={fetchData}
        product={productToAdjust}
      />
    </div>
  );
};
