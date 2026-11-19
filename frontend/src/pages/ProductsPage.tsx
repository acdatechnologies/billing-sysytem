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
  ChevronRight,
  ArrowLeft,
  Save,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Product, ProductCategory, ProductInput, StockAdjustmentInput } from '../types';
import { productApi } from '../api/productApi';
import { inventoryApi } from '../api/inventoryApi';
import { validateProduct, validateStockAdjustment } from '../utils/validators';
import { Pagination, DateRangeFilter, useTablePagination } from '../components/common';

const COMMON_UNITS = ['PCS', 'MTR', 'SET', 'BOX', 'ROLL', 'PKT', 'DOZ'];
const COMMON_GST_RATES = [0, 5, 12, 18, 28];

const TEXTILE_SIZES = ['Free Size', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38', '40', '42', 'Unstitched'];
const TEXTILE_COLORS = ['White', 'Black', 'Navy Blue', 'Maroon', 'Red', 'Sky Blue', 'Pink', 'Green', 'Yellow', 'Grey', 'Cream', 'Multi'];
const TEXTILE_FABRICS = ['Cotton', 'Pure Silk', 'Art Silk', 'Linen', 'Rayon', 'Polyester', 'Denim', 'Georgette', 'Chiffon', 'Banarasi', 'Satin', 'Handloom'];
const TEXTILE_GENDERS = ["Men's Wear", "Women's Wear", "Boys", "Girls", "Kids / Baby", "Unisex", "Home Textiles"];

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'LIST' | 'FORM' | 'ADJUST'
  const [view, setView] = useState<'LIST' | 'FORM' | 'ADJUST'>('LIST');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW' | 'OUT'>('ALL');

  // Pagination & Date Filter Hook
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startDate,
    endDate,
    setDateRange,
    clearDateFilter,
    paginatedItems: paginatedProducts,
    getSerialNumber,
  } = useTablePagination<Product>({
    items: products,
    initialPageSize: 10,
    dateField: 'created_at',
  });

  // Reset page when search or dropdown filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedGender, selectedSize, stockFilter, setCurrentPage]);

  // Product Form State (Add / Edit)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    code: '',
    barcode: '',
    category_id: '',
    unit: 'PCS',
    size: '',
    color: '',
    fabric: '',
    gender: "Men's Wear",
    brand: '',
    rack_location: '',
    purchase_price: 0,
    selling_price: 0,
    opening_stock: 0,
    minimum_stock: 5,
    gst_rate: 5,
    hsn_code: '',
  });
  const [isCustomGst, setIsCustomGst] = useState(false);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [isCustomFabric, setIsCustomFabric] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Category State inside Form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  // Stock Adjustment State
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'RETURN'>('RESTOCK');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  // Delete Confirmation & Alerts
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodList, catList] = await Promise.all([
        productApi.getProducts({
          search: search.trim() || undefined,
          categoryId: selectedCategory || undefined,
          stockStatus: stockFilter,
        }),
        productApi.getCategories(),
      ]);
      let filtered = prodList || [];
      if (selectedGender) {
        filtered = filtered.filter((p) => p.gender && p.gender.toLowerCase().includes(selectedGender.toLowerCase()));
      }
      if (selectedSize) {
        filtered = filtered.filter((p) => p.size && p.size.toLowerCase() === selectedSize.toLowerCase());
      }
      setProducts(filtered);
      setCategories(catList || []);
    } catch (err) {
      console.error('[ProductsPage] Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, stockFilter, selectedGender, selectedSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Add Product View
  const handleOpenAdd = async () => {
    setProductToEdit(null);
    let nextCode = 'PRO01';
    try {
      nextCode = await productApi.getNextProductCode();
    } catch (err) {
      console.error('[ProductsPage] Failed to get next product code:', err);
    }

    setFormData({
      name: '',
      code: nextCode,
      barcode: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      unit: 'PCS',
      size: '',
      color: '',
      fabric: '',
      gender: "Men's Wear",
      brand: '',
      rack_location: '',
      purchase_price: 0,
      selling_price: 0,
      opening_stock: 0,
      minimum_stock: 5,
      gst_rate: 5,
      hsn_code: '',
    });
    setIsCustomGst(false);
    setIsCustomSize(false);
    setIsCustomColor(false);
    setIsCustomFabric(false);
    setFormError(null);
    setView('FORM');
  };

  // Open Edit Product View
  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setFormData({
      name: product.name,
      code: product.code,
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      unit: product.unit || 'PCS',
      size: product.size || '',
      color: product.color || '',
      fabric: product.fabric || '',
      gender: product.gender || "Men's Wear",
      brand: product.brand || '',
      rack_location: product.rack_location || '',
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      minimum_stock: product.minimum_stock,
      gst_rate: product.gst_rate !== undefined ? product.gst_rate : 5,
      hsn_code: product.hsn_code || '',
    });
    setIsCustomGst(!COMMON_GST_RATES.includes(product.gst_rate));
    setIsCustomSize(Boolean(product.size && !TEXTILE_SIZES.includes(product.size)));
    setIsCustomColor(Boolean(product.color && !TEXTILE_COLORS.includes(product.color)));
    setIsCustomFabric(Boolean(product.fabric && !TEXTILE_FABRICS.includes(product.fabric)));
    setFormError(null);
    setView('FORM');
  };

  // Open Adjust Stock View
  const handleOpenAdjust = (product: Product) => {
    setProductToAdjust(product);
    setAdjustmentType('RESTOCK');
    setAdjustmentQty(1);
    setAdjustmentNotes('');
    setAdjustmentError(null);
    setView('ADJUST');
  };

  // Handle Product Form Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateProduct({
      name: formData.name,
      code: formData.code,
      selling_price: formData.selling_price,
      purchase_price: formData.purchase_price,
      current_stock: formData.opening_stock,
      minimum_stock: formData.minimum_stock,
      gst_rate: formData.gst_rate,
      hsn_code: formData.hsn_code,
    });

    if (!validation.isValid) {
      setFormError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      const catObj = categories.find((c) => c.id === formData.category_id);
      const submissionData = {
        ...formData,
        category_name: catObj ? catObj.name : '',
      };
      if (productToEdit) {
        await productApi.updateProduct(productToEdit.id, submissionData);
        setFeedbackMessage(`Product "${formData.name}" updated successfully!`);
      } else {
        await productApi.createProduct(submissionData);
        setFeedbackMessage(`Product "${formData.name}" added successfully!`);
      }
      await fetchData();
      setView('LIST');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Category Create
  const handleCreateCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    // If it already exists in the list, just select it
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setFormData({ ...formData, category_id: existing.id });
      setNewCatName('');
      setShowAddCategory(false);
      setCatError(null);
      return;
    }

    try {
      setCatError(null);
      const cat = await productApi.createCategory(trimmed);
      setCategories([...categories, cat]);
      setFormData({ ...formData, category_id: cat.id });
      setNewCatName('');
      setShowAddCategory(false);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('11000') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
        setCatError(`Category "${trimmed}" already exists. Please choose another name.`);
      } else {
        setCatError(msg || 'Failed to create category');
      }
    }
  };

  // Handle Stock Adjustment Submit
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToAdjust) return;

    const mappedType = adjustmentType === 'CORRECTION' ? 'AUDIT_CORRECTION' : adjustmentType;

    const validation = validateStockAdjustment({
      productId: productToAdjust.id,
      movementType: mappedType,
      quantity: Number(adjustmentQty),
      currentStock: productToAdjust.current_stock,
      notes: adjustmentNotes.trim(),
    });

    if (!validation.isValid) {
      setAdjustmentError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryApi.adjustStock({
        productId: productToAdjust.id,
        movementType: mappedType as any,
        quantity: Number(adjustmentQty),
        reason: mappedType,
        notes: adjustmentNotes.trim() || undefined,
      });
      setFeedbackMessage(`Stock for "${productToAdjust.name}" adjusted successfully!`);
      await fetchData();
      setView('LIST');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setAdjustmentError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await productApi.deleteProduct(deleteConfirmProduct.id);
      setFeedbackMessage(`Product "${deleteConfirmProduct.name}" deleted successfully.`);
      setTimeout(() => setFeedbackMessage(null), 5000);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setDeleteConfirmProduct(null);
    }
  };

  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Number(val);
    const safeVal = isNaN(num) || !isFinite(num) ? 0 : num;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(safeVal);
  };

  // -------------------------------------------------------------
  // RENDER: BREADCRUMBS SUBVIEW FOR ADD / EDIT PRODUCT
  // -------------------------------------------------------------
  if (view === 'FORM') {
    return (
      <div className="w-full space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setView('LIST')}
              className="text-slate-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>Products</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
              {productToEdit ? `Edit: ${productToEdit.name}` : 'Add New Product'}
            </span>
          </div>

          <button
            onClick={() => setView('LIST')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Products List
          </button>
        </div>

        {/* Full-Page Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {productToEdit ? `Edit Product: ${productToEdit.name}` : 'Product Specifications & Pricing'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure SKU details, barcode, GST tax slab, selling price, and initial inventory stock.
              </p>
            </div>
          </div>

          <form onSubmit={handleProductSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* General Information */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Product Code / SKU <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Auto-Generated (Read-Only)</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={formData.code}
                    placeholder="e.g. PRO01"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 font-mono uppercase font-semibold cursor-not-allowed select-none focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cotton Formal Shirt"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Barcode (EAN / UPC)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="text-2xs text-red-600 font-semibold hover:underline"
                    >
                      {showAddCategory ? 'Cancel' : '+ New Category'}
                    </button>
                  </div>

                  {showAddCategory ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 text-xs px-3 py-2 border border-red-300 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {catError && <p className="text-[11px] text-red-500 mt-1">{catError}</p>}
                </div>
              </div>
            </div>

            {/* Textile & Garment Specifications */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Textile & Garment Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Size Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Size</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSize(!isCustomSize);
                        if (!isCustomSize) setFormData((prev) => ({ ...prev, size: '' }));
                      }}
                      className="text-2xs text-red-600 font-semibold hover:underline"
                    >
                      {isCustomSize ? 'Presets' : '+ Custom'}
                    </button>
                  </div>
                  {isCustomSize ? (
                    <input
                      type="text"
                      placeholder="e.g. 38, 40, XL, Free Size"
                      value={formData.size || ''}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  ) : (
                    <select
                      value={formData.size || ''}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomSize(true);
                          setFormData({ ...formData, size: '' });
                        } else {
                          setFormData({ ...formData, size: e.target.value });
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      <option value="">-- Select Size --</option>
                      {TEXTILE_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Other Custom Size...</option>
                    </select>
                  )}
                </div>

                {/* Color Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Color / Shade</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomColor(!isCustomColor);
                        if (!isCustomColor) setFormData((prev) => ({ ...prev, color: '' }));
                      }}
                      className="text-2xs text-red-600 font-semibold hover:underline"
                    >
                      {isCustomColor ? 'Presets' : '+ Custom'}
                    </button>
                  </div>
                  {isCustomColor ? (
                    <input
                      type="text"
                      placeholder="e.g. Navy Blue, White, Maroon"
                      value={formData.color || ''}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  ) : (
                    <select
                      value={formData.color || ''}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomColor(true);
                          setFormData({ ...formData, color: '' });
                        } else {
                          setFormData({ ...formData, color: e.target.value });
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      <option value="">-- Select Color --</option>
                      {TEXTILE_COLORS.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Other Custom Color...</option>
                    </select>
                  )}
                </div>

                {/* Fabric Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Fabric / Material</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomFabric(!isCustomFabric);
                        if (!isCustomFabric) setFormData((prev) => ({ ...prev, fabric: '' }));
                      }}
                      className="text-2xs text-red-600 font-semibold hover:underline"
                    >
                      {isCustomFabric ? 'Presets' : '+ Custom'}
                    </button>
                  </div>
                  {isCustomFabric ? (
                    <input
                      type="text"
                      placeholder="e.g. Cotton, Pure Silk"
                      value={formData.fabric || ''}
                      onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  ) : (
                    <select
                      value={formData.fabric || ''}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomFabric(true);
                          setFormData({ ...formData, fabric: '' });
                        } else {
                          setFormData({ ...formData, fabric: e.target.value });
                        }
                      }}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      <option value="">-- Select Fabric --</option>
                      {TEXTILE_FABRICS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Other Custom Fabric...</option>
                    </select>
                  )}
                </div>

                {/* Section Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Section
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  >
                    <option value="">-- Select Section --</option>
                    {TEXTILE_GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramraj, Otto"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* Rack / Location in Shop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-1"
                    value={formData.rack_location || ''}
                    onChange={(e) => setFormData({ ...formData, rack_location: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & GST */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Pricing & Tax (GST)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purchase Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono font-bold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsn_code || ''}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    placeholder="e.g. 8471"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                {/* GST Slab */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">GST Slab Rate</label>
                  <div className="flex items-center flex-wrap gap-2">
                    {COMMON_GST_RATES.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          setIsCustomGst(false);
                          setFormData({ ...formData, gst_rate: rate });
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          !isCustomGst && formData.gst_rate === rate
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {rate}% GST
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Stock Levels */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Inventory Setup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!productToEdit && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Opening Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.opening_stock || 0}
                      onChange={(e) => setFormData({ ...formData, opening_stock: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Minimum Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Trigger low stock warning badge when stock drops below this number</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setView('LIST')}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg shadow-sm shadow-red-600/30 transition-all"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : productToEdit ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: BREADCRUMBS SUBVIEW FOR ADJUST STOCK
  // -------------------------------------------------------------
  if (view === 'ADJUST' && productToAdjust) {
    const curStock = Number(productToAdjust.current_stock) || 0;
    let resultingStock = curStock;
    const numQty = Number(adjustmentQty) || 0;
    if (adjustmentType === 'RESTOCK' || adjustmentType === 'RETURN') {
      resultingStock = curStock + numQty;
    } else if (adjustmentType === 'DAMAGE') {
      resultingStock = curStock - numQty;
    } else if (adjustmentType === 'CORRECTION') {
      resultingStock = numQty;
    }

    return (
      <div className="w-full space-y-6 pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setView('LIST')}
              className="text-slate-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>Products</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Adjust Stock: {productToAdjust.name}
            </span>
          </div>

          <button
            onClick={() => setView('LIST')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Products
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Adjust Physical Stock</h2>
              <p className="text-xs text-slate-500">
                Log restock shipments, damaged write-offs, customer returns, or physical count reconciliation.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-6">
            {adjustmentError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{adjustmentError}</span>
              </div>
            )}

            {/* Current vs Projected Stock Preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-around">
              <div className="text-center">
                <span className="text-2xs font-bold uppercase text-slate-400">Current Stock</span>
                <div className="text-2xl font-bold text-slate-700 font-mono">{curStock} {productToAdjust.unit}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-rose-400" />
              <div className="text-center">
                <span className="text-2xs font-bold uppercase text-slate-400">Resulting Stock</span>
                <div className={`text-2xl font-bold font-mono ${resultingStock < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {resultingStock} {productToAdjust.unit}
                </div>
              </div>
            </div>

            {/* Adjustment Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Adjustment Reason</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'RESTOCK', label: 'Restock / Inflow', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
                  { id: 'DAMAGE', label: 'Damage / Loss', color: 'text-red-700 border-red-300 bg-red-50' },
                  { id: 'RETURN', label: 'Customer Return', color: 'text-rose-700 border-rose-300 bg-rose-50' },
                  { id: 'CORRECTION', label: 'Audit Count', color: 'text-red-700 border-red-300 bg-red-50' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAdjustmentType(type.id as any)}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      adjustmentType === type.id
                        ? `${type.color} ring-2 ring-red-500/20`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {adjustmentType === 'CORRECTION' ? 'Verified Physical Stock Count' : 'Units to Adjust'}
              </label>
              <input
                type="number"
                min={adjustmentType === 'CORRECTION' ? 0 : 1}
                required
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Audit Note / Remarks</label>
              <input
                type="text"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="e.g. Received shipment from distributor invoice #904"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setView('LIST')}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg shadow-sm shadow-red-600/30 transition-all"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Updating...' : 'Commit Stock Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: PRODUCTS MAIN LIST VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-5 pb-12">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, size, color, brand, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800"
          />
        </div>

        {/* Textile Filters & Action Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Section / Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-medium"
          >
            <option value="">All Sections</option>
            {TEXTILE_GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Size Filter */}
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-medium"
          >
            <option value="">All Sizes</option>
            {TEXTILE_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                Size {sz}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-medium"
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
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-medium"
          >
            <option value="ALL">All Stock</option>
            <option value="HEALTHY">In Stock</option>
            <option value="LOW">Low Stock</option>
            <option value="OUT">Out of Stock</option>
          </select>

          {/* Date Range Filter */}
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={setDateRange}
            onClear={clearDateFilter}
          />

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-red-600/30 transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold text-center w-12">S.No</th>
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
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No Products Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search || startDate || endDate ? 'Try clearing your search or date filter.' : 'Click "Add Garment" to create your first item.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item, index) => {
                  const isOutOfStock = item.current_stock <= 0;
                  const isLowStock = item.current_stock <= item.minimum_stock && !isOutOfStock;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                        {getSerialNumber(index)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {item.size && (
                            <span className="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.color}
                            </span>
                          )}
                          {item.fabric && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.fabric}
                            </span>
                          )}
                          {item.gender && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {item.gender.split(' ')[0]}
                            </span>
                          )}
                          {item.rack_location && (
                            <span className="text-[10px] font-mono font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                              📍 {item.rack_location}
                            </span>
                          )}
                        </div>
                        {(item.brand || item.hsn_code) && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {item.brand ? `Brand: ${item.brand}` : ''}
                            {item.brand && item.hsn_code ? ' | ' : ''}
                            {item.hsn_code ? `HSN: ${item.hsn_code}` : ''}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="font-semibold text-red-700">{item.code}</div>
                        {item.barcode && <div className="text-[10px] text-slate-400">{item.barcode}</div>}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {item.category_name || categories.find((c) => c.id === item.category_id)?.name || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {formatCurrency(item.purchase_price)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.selling_price)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.gst_rate}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-mono font-bold inline-block px-2 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.current_stock} {item.unit}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            title="Adjust Stock"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Boxes className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmProduct(item)}
                            title="Delete Product"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          itemName="garments"
        />
      </div>

      {/* Delete Confirmation Box */}
      {deleteConfirmProduct && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Are you sure you want to delete <strong>"{deleteConfirmProduct.name}"</strong>?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteConfirmProduct(null)}
              className="px-3 py-1 text-xs bg-white text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProduct}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
