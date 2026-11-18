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
  Sparkles,
} from 'lucide-react';
import { Product, StockMovement, InventorySummary, StockAdjustmentInput } from '../types';
import { inventoryApi } from '../api/inventoryApi';
import { productApi } from '../api/productApi';
import { validateStockAdjustment } from '../utils/validators';

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
      setProducts(prodList || []);
      setSummary(sumData);
      setMovements(movList || []);
    } catch (err) {
      console.error('[InventoryPage] Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, stockStatusFilter]);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getMovementBadge = (type: StockMovement['movement_type']) => {
    switch (type) {
      case 'RESTOCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Restock Intake</span>;
      case 'DAMAGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Damaged / Lost</span>;
      case 'CORRECTION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Physical Count</span>;
      case 'RETURN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Customer Return</span>;
      case 'OPENING_STOCK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Opening Stock</span>;
      case 'SALE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Invoice Sale</span>;
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
      <div className="space-y-6 max-w-2xl mx-auto pb-12">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setView('LIST')}
              className="text-slate-500 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors"
            >
              <Boxes className="w-4 h-4 text-slate-400" />
              <span>Inventory</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
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
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
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
              <ArrowRight className="w-5 h-5 text-purple-400" />
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'RESTOCK', label: 'Restock / Intake', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
                  { id: 'DAMAGE', label: 'Damage / Loss', color: 'text-red-700 border-red-300 bg-red-50' },
                  { id: 'RETURN', label: 'Customer Return', color: 'text-blue-700 border-blue-300 bg-blue-50' },
                  { id: 'CORRECTION', label: 'Audit Count', color: 'text-purple-700 border-purple-300 bg-purple-50' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAdjustmentType(type.id as any)}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      adjustmentType === type.id
                        ? `${type.color} ring-2 ring-purple-500/20`
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
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
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
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Top 4 KPI Summary Cards */}
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
              {summary.totalUnits}{' '}
              <span className="text-xs font-normal text-slate-400">units</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Spread across {summary.totalSkus} active items
            </p>
          </div>
        </div>

        {/* Inventory Cost Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Value (Cost)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(summary.totalCostValuation)}
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
              {formatCurrency(summary.totalRetailValuation)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Est. Profit: {formatCurrency(summary.totalRetailValuation - summary.totalCostValuation)}
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
              <span className="text-xl font-bold text-amber-600">{summary.lowStockCount}</span>
              <span className="text-[11px] text-slate-500 block">Low Stock</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-xl font-bold text-red-600">{summary.outOfStockCount}</span>
              <span className="text-[11px] text-slate-500 block">Out of Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'STOCK'
              ? 'bg-purple-50 text-purple-700'
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
              ? 'bg-purple-50 text-purple-700'
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock by item or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-700 font-medium"
              >
                <option value="ALL">All Items</option>
                <option value="LOW">Low Stock Only</option>
                <option value="OUT">Out of Stock Only</option>
                <option value="HEALTHY">In Stock (Healthy)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
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
                  {products.map((item) => {
                    const isOutOfStock = item.current_stock <= 0;
                    const isLowStock = item.current_stock <= item.minimum_stock && !isOutOfStock;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400">Unit: {item.unit}</div>
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-purple-700">{item.code}</td>

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
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-2xs font-semibold transition-colors"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
