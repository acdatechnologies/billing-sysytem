import React, { useState, useEffect } from 'react';
import { X, Save, FolderPlus, AlertCircle } from 'lucide-react';
import { Product, ProductInput, ProductCategory } from '../types';
import { productApi } from '../api/productApi';
import { validateProduct } from '../utils/validators';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  productToEdit?: Product | null;
  categories: ProductCategory[];
  onCategoryCreated: (category: ProductCategory) => void;
}

const COMMON_UNITS = ['PCS', 'MTR', 'SET', 'BOX', 'ROLL', 'PKT', 'DOZ'];
const COMMON_GST_RATES = [0, 5, 12, 18, 28];

const TEXTILE_SIZES = ['Free Size', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '28', '30', '32', '34', '36', '38', '40', '42', 'Unstitched'];
const TEXTILE_COLORS = ['White', 'Black', 'Navy Blue', 'Maroon', 'Red', 'Sky Blue', 'Pink', 'Green', 'Yellow', 'Grey', 'Cream', 'Multi'];
const TEXTILE_FABRICS = ['Cotton', 'Pure Silk', 'Art Silk', 'Linen', 'Rayon', 'Polyester', 'Denim', 'Georgette', 'Chiffon', 'Banarasi', 'Satin', 'Handloom'];
const TEXTILE_GENDERS = ["Men's Wear", "Women's Wear", "Boys", "Girls", "Kids / Baby", "Unisex", "Home Textiles"];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  productToEdit,
  categories,
  onCategoryCreated,
}) => {
  const isEditing = Boolean(productToEdit);

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Category Modal state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        code: productToEdit.code,
        barcode: productToEdit.barcode || '',
        category_id: productToEdit.category_id || '',
        unit: productToEdit.unit || 'PCS',
        size: productToEdit.size || '',
        color: productToEdit.color || '',
        fabric: productToEdit.fabric || '',
        gender: productToEdit.gender || "Men's Wear",
        brand: productToEdit.brand || '',
        rack_location: productToEdit.rack_location || '',
        purchase_price: productToEdit.purchase_price,
        selling_price: productToEdit.selling_price,
        minimum_stock: productToEdit.minimum_stock,
        gst_rate: productToEdit.gst_rate !== undefined ? productToEdit.gst_rate : 5,
        hsn_code: productToEdit.hsn_code || '',
      });
      setIsCustomGst(!COMMON_GST_RATES.includes(productToEdit.gst_rate));
      setIsCustomSize(Boolean(productToEdit.size && !TEXTILE_SIZES.includes(productToEdit.size)));
      setIsCustomColor(Boolean(productToEdit.color && !TEXTILE_COLORS.includes(productToEdit.color)));
      setIsCustomFabric(Boolean(productToEdit.fabric && !TEXTILE_FABRICS.includes(productToEdit.fabric)));
    } else {
      let isCancelled = false;
      productApi.getNextProductCode().then((code) => {
        if (!isCancelled && code) {
          setFormData((prev) => ({ ...prev, code }));
        }
      }).catch(() => {});

      setFormData({
        name: '',
        code: 'PRO01',
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
      return () => {
        isCancelled = true;
      };
    }
    setError(null);
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const generateAutoCode = async () => {
    try {
      const nextCode = await productApi.getNextProductCode();
      setFormData((prev) => ({ ...prev, code: nextCode }));
    } catch {
      setFormData((prev) => ({ ...prev, code: 'PRO01' }));
    }
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setCatError('Category name is required.');
      return;
    }

    // If category already exists in the list, automatically select it
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setFormData((prev) => ({ ...prev, category_id: existing.id }));
      setNewCatName('');
      setShowAddCategory(false);
      setCatError(null);
      return;
    }

    try {
      const created = await productApi.createCategory(trimmed);
      onCategoryCreated(created);
      setFormData((prev) => ({ ...prev, category_id: created.id }));
      setNewCatName('');
      setShowAddCategory(false);
      setCatError(null);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('11000') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
        setCatError(`Category "${trimmed}" already exists. Please choose another name.`);
      } else {
        setCatError(msg || 'Failed to create category');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

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
      setFieldErrors(validation.errors);
      setError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      const catObj = categories.find((c) => c.id === formData.category_id);
      const submissionData = {
        ...formData,
        category_name: catObj ? catObj.name : '',
      };
      if (isEditing && productToEdit) {
        await productApi.updateProduct(productToEdit.id, submissionData as any);
      } else {
        await productApi.createProduct(submissionData as any);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-base text-slate-800">
              {isEditing ? 'Edit Product Details' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Enter product pricing, HSN code, GST rate and inventory limits
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Item Code / SKU <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Auto-Generated (Read-Only)</span>
              </div>
              <input
                type="text"
                readOnly
                placeholder="e.g. PRO01"
                value={formData.code}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-600 cursor-not-allowed select-none uppercase font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cotton Formal Shirt"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Row 2: Barcode & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Barcode / EAN <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Scan or enter barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Category</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-[11px] text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                >
                  <FolderPlus className="w-3 h-3" /> + New Category
                </button>
              </div>

              {showAddCategory ? (
                <div className="p-2 bg-red-50/70 border border-red-200 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                  {catError && <p className="text-[10px] text-red-600 font-medium">{catError}</p>}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(false)}
                      className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-2.5 py-1 text-[11px] bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white rounded font-medium"
                    >
                      Save Category
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-medium"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Textile & Garment Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {/* Size Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Size</label>
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
                  placeholder="e.g. 40, XL, Free Size"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Color / Shade</label>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Fabric / Material</label>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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

            {/* Gender / Section */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Section
              </label>
              <select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
              >
                <option value="">-- Select Section --</option>
                {TEXTILE_GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand / Manufacturer */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                placeholder="e.g. Ramraj, Otto"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Rack / Location in Shop */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rack / Shelf Location
              </label>
              <input
                type="text"
                placeholder="e.g. Rack A-1"
                value={formData.rack_location || ''}
                onChange={(e) => setFormData({ ...formData, rack_location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
              />
            </div>
          </div>

          {/* Row 3: HSN Code & GST Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                HSN / SAC Code
              </label>
              <input
                type="text"
                placeholder="e.g. 6205 (Garments)"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <div className="flex items-center gap-2">
                {!isCustomGst ? (
                  <select
                    value={formData.gst_rate}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomGst(true);
                      } else {
                        setFormData({ ...formData, gst_rate: Number(e.target.value) });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-semibold"
                  >
                    {COMMON_GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}% GST
                      </option>
                    ))}
                    <option value="custom">Custom Rate...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Rate %"
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomGst(false);
                        setFormData({ ...formData, gst_rate: 18 });
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline flex-shrink-0"
                    >
                      Presets
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Pricing (Purchase & Selling) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Purchase / Cost Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-semibold"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Used for inventory valuation & profits</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-900 font-bold text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Unit billing price charged to customer</p>
            </div>
          </div>

          {/* Row 5: Stock Levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Opening Physical Stock
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.opening_stock}
                  onChange={(e) => setFormData({ ...formData, opening_stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Initial stock in hand today</p>
              </div>
            )}

            <div className={isEditing ? 'md:col-span-2' : ''}>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Stock Alert Level
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-800 font-semibold"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Triggers dashboard low stock warnings when stock falls to or below this count
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 text-white px-5 py-2 rounded-lg font-semibold shadow-md shadow-red-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
