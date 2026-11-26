import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  History,
  TrendingUp,
  IndianRupee,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  ChevronRight,
  ArrowLeft,
  Save,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Product, StockMovement, InventorySummary, StockAdjustmentInput } from '../types';
import { inventoryApi } from '../api/inventoryApi';
import { productApi } from '../api/productApi';
import { validateStockAdjustment } from '../utils/validators';
import { Pagination, DateRangeFilter, useTablePagination } from '../components/common';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOGS'>('STOCK');
  const [view, setView] = useState<'LIST' | 'ADJUST'>('LIST');

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalSkus: 0,
    totalUnits: 0,
    totalCostValuation: 0,
    totalRetailValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'HEALTHY'>('ALL');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Pagination & Date Filter Hook for Inventory Stock
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stockStatusFilter, selectedGender, selectedSize, setCurrentPage]);

  // Stock Adjustment Form State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'RETURN'>('RESTOCK');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodList, sumData, movList] = await Promise.all([
        productApi.getProducts({
          search: search.trim() || undefined,
          stockStatus: stockStatusFilter,
        }),
        inventoryApi.getInventorySummary(),
        inventoryApi.getStockMovements(undefined, 80),
      ]);
      let filtered = prodList || [];
      if (selectedGender) {
        filtered = filtered.filter((p) => p.gender && p.gender.toLowerCase().includes(selectedGender.toLowerCase()));
      }
      if (selectedSize) {
        filtered = filtered.filter((p) => p.size && p.size.toLowerCase() === selectedSize.toLowerCase());
      }
      setProducts(filtered);
      setSummary(sumData);
      setMovements(movList || []);
    } catch (err) {
      console.error('[InventoryPage] Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, stockStatusFilter, selectedGender, selectedSize]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const handleOpenAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentType('RESTOCK');
    setAdjustmentQty(1);
    setAdjustmentNotes('');
    setAdjustmentError(null);
    setView('ADJUST');
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const mappedType = adjustmentType === 'CORRECTION' ? 'AUDIT_CORRECTION' : adjustmentType;

    const validation = validateStockAdjustment({
      productId: selectedProduct.id,
      movementType: mappedType,
      quantity: Number(adjustmentQty),
      currentStock: selectedProduct.current_stock,
      notes: adjustmentNotes.trim(),
    });

    if (!validation.isValid) {
      setAdjustmentError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryApi.adjustStock({
        productId: selectedProduct.id,
        movementType: mappedType as any,
        quantity: Number(adjustmentQty),
        reason: mappedType,
        notes: adjustmentNotes.trim() || undefined,
      });
      setFeedbackMessage(`Stock for "${selectedProduct.name}" updated successfully!`);
      await fetchInventoryData();
      setView('LIST');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setAdjustmentError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
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

  const getMovementBadge = (type: StockMovement['movement_type']) => {
    switch (type) {
      case 'RESTOCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Restock Intake</span>;
      case 'DAMAGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Damaged / Lost</span>;
      case 'CORRECTION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Physical Count</span>;
      case 'RETURN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Customer Return</span>;
      case 'OPENING_STOCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Opening Stock</span>;
      case 'SALE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Invoice Sale</span>;
      case 'CANCELLATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Bill Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{type}</span>;
    }
  };

  // -------------------------------------------------------------
  // RENDER: BREADCRUMBS SUBVIEW FOR ADJUST STOCK
  // -------------------------------------------------------------
  if (view === 'ADJUST' && selectedProduct) {
    const curStock = Number(selectedProduct.current_stock) || 0;
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
              <Boxes className="w-4 h-4 text-slate-400" />
              <span>Inventory</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Stock Adjustment: {selectedProduct.name}
            </span>
          </div>

          <button
            onClick={() => setView('LIST')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Inventory Overview
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
                Log inventory movement with instant balance recalculation and audit trail entry.
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
                <div className="text-2xl font-bold text-slate-700 font-mono">{curStock} {selectedProduct.unit}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-rose-400" />
              <div className="text-center">
                <span className="text-2xs font-bold uppercase text-slate-400">Resulting Stock</span>
                <div className={`text-2xl font-bold font-mono ${resultingStock < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {resultingStock} {selectedProduct.unit}
                </div>
              </div>
            </div>

            {/* Reason selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Adjustment Reason</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'RESTOCK', label: 'Restock / Intake', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
                  { id: 'RETURN', label: 'Customer Return', color: 'text-rose-700 border-rose-300 bg-rose-50' },
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
                Units to Adjust
              </label>
              <input
                type="number"
                min={1}
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
                placeholder="e.g. Received shipment from distributor"
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
  // RENDER: INVENTORY MAIN LIST & LOGS VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
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

      {/* Top 4 KPI Summary Cards */}
      {(() => {
        const displayUnits = Number(summary?.totalUnits) || products.reduce((acc, p) => acc + (Number(p.current_stock) || 0), 0);
        const displaySkus = Number(summary?.totalSkus) || products.length;
        const displayCostValuation = Number(summary?.totalCostValuation) || products.reduce((acc, p) => acc + ((Number(p.purchase_price) || 0) * (Number(p.current_stock) || 0)), 0);
        const displayRetailValuation = Number(summary?.totalRetailValuation) || products.reduce((acc, p) => acc + ((Number(p.selling_price) || 0) * (Number(p.current_stock) || 0)), 0);
        const displayProfit = displayRetailValuation - displayCostValuation;
        const displayLowStock = Number(summary?.lowStockCount) || products.filter(p => (Number(p.current_stock) || 0) > 0 && (Number(p.current_stock) || 0) <= (Number(p.minimum_stock) || 0)).length;
        const displayOutOfStock = Number(summary?.outOfStockCount) || products.filter(p => (Number(p.current_stock) || 0) <= 0).length;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Stock Units */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Stock In Hand
                </span>
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {displayUnits}{' '}
                  <span className="text-xs font-normal text-slate-400">units</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Spread across {displaySkus} active items
                </p>
              </div>
            </div>

            {/* Inventory Cost Valuation */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stock Value (Cost)
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {formatCurrency(displayCostValuation)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Based on purchase prices
                </p>
              </div>
            </div>

            {/* Inventory Retail Potential */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Retail Potential (MRP)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {formatCurrency(displayRetailValuation)}
                </h3>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  Est. Profit: {formatCurrency(displayProfit)}
                </p>
              </div>
            </div>

            {/* Stock Alerts */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stock Attention
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div>
                  <span className="text-xl font-bold text-amber-600">{displayLowStock}</span>
                  <span className="text-[11px] text-slate-500 block">Low Stock</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-xl font-bold text-red-600">{displayOutOfStock}</span>
                  <span className="text-[11px] text-slate-500 block">Out of Stock</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'STOCK'
              ? 'bg-red-50 text-red-700'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Real-Time Stock Status</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'LOGS'
              ? 'bg-red-50 text-red-700'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Audit Logs ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: STOCK STATUS TABLE */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock by item, size, color, rack..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Section Filter */}
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
              >
                <option value="">All Sections</option>
                <option value="Men">Men's Wear</option>
                <option value="Women">Women's Wear</option>
                <option value="Kids">Kids & Babies</option>
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Home">Home Textiles</option>
              </select>

              {/* Size Filter */}
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
              >
                <option value="">All Sizes</option>
                {['Free Size', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', 'Unstitched'].map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 font-medium"
              >
                <option value="ALL">All Stock</option>
                <option value="LOW">Low Stock Only</option>
                <option value="OUT">Out of Stock Only</option>
                <option value="HEALTHY">In Stock (Healthy)</option>
              </select>

              {/* Date Range Filter */}
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onChange={setDateRange}
                onClear={clearDateFilter}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 font-semibold text-center w-12">S.No</th>
                    <th className="py-3 px-4 font-semibold">Product Name</th>
                    <th className="py-3 px-3 font-semibold">SKU / Code</th>
                    <th className="py-3 px-3 font-semibold text-right">Cost Price</th>
                    <th className="py-3 px-3 font-semibold text-right">Selling Price</th>
                    <th className="py-3 px-3 font-semibold text-right">Min Threshold</th>
                    <th className="py-3 px-3 font-semibold text-right">Current Available</th>
                    <th className="py-3 px-3 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No inventory stock items matching the selected filters.
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
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="text-[10px] font-medium bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                                {item.color}
                              </span>
                            )}
                            {item.fabric && (
                              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                {item.fabric}
                              </span>
                            )}
                            {item.rack_location && (
                              <span className="text-[10px] font-mono font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                📍 {item.rack_location}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Unit: <strong className="text-slate-600">{item.unit}</strong>{' '}
                            {item.brand ? `| Brand: ${item.brand}` : ''}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-red-700">{item.code}</td>

                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(item.purchase_price)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.selling_price)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-slate-400">
                          {item.minimum_stock} {item.unit}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'
                            }`}
                          >
                            {item.current_stock}
                          </span>{' '}
                          <span className="text-[10px] text-slate-400">{item.unit}</span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              In Stock
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenAdjustment(item)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-2xs font-semibold transition-colors"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>

            {/* Inventory Stock Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              itemName="stock items"
            />
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">Item & SKU</th>
                  <th className="py-3 px-3 font-semibold">Movement Type</th>
                  <th className="py-3 px-3 font-semibold text-right">Prev Stock</th>
                  <th className="py-3 px-3 font-semibold text-center">Quantity Delta</th>
                  <th className="py-3 px-3 font-semibold text-right">Result Stock</th>
                  <th className="py-3 px-4 font-semibold">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(m.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{m.product_name || 'Item'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{m.product_code}</div>
                      </td>
                      <td className="py-3 px-3">{getMovementBadge(m.movement_type)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">{m.previous_stock}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : <ArrowDownRight className="w-3 h-3 text-red-600" />}
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{m.current_stock}</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{m.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
