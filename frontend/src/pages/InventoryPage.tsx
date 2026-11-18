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
} from 'lucide-react';
import { Product, StockMovement, InventorySummary } from '../types';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOGS'>('STOCK');
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

  // Stock Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const [prodList, sumData, movList] = await Promise.all([
          window.electronAPI.getProducts({
            search: search.trim() || undefined,
            stockStatus: stockStatusFilter,
          }),
          window.electronAPI.getInventorySummary(),
          window.electronAPI.getStockMovements(undefined, 80),
        ]);
        setProducts(prodList || []);
        setSummary(sumData);
        setMovements(movList || []);
      }
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
    setIsAdjustmentModalOpen(true);
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

  return (
    <div className="space-y-6">
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
              Total capital invested in inventory
            </p>
          </div>
        </div>

        {/* Inventory Retail Potential Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Retail Potential (Sales)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatCurrency(summary.totalRetailValuation)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Estimated gross revenue on full sale
            </p>
          </div>
        </div>

        {/* Low Stock & Out of Stock Alert Card */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-3">
              <div className="text-2xl font-bold text-amber-800">
                {summary.lowStockCount}{' '}
                <span className="text-xs font-semibold text-amber-600">Low</span>
              </div>
              <div className="text-xl font-bold text-red-600 border-l border-amber-300 pl-3">
                {summary.outOfStockCount}{' '}
                <span className="text-xs font-semibold text-red-500">Out</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              Products needing urgent reorder
            </p>
          </div>
        </div>
      </div>

      {/* Tabs and Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab switch buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'STOCK'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Current Stock Levels ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'LOGS'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Movement Audit Log ({movements.length})</span>
          </button>
        </div>

        {/* Search & Stock Filter (only when in Stock tab) */}
        {activeTab === 'STOCK' && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="ALL">All Items</option>
              <option value="LOW">Low Stock Items</option>
              <option value="OUT">Out of Stock</option>
              <option value="HEALTHY">Healthy Stock</option>
            </select>

            <button
              onClick={fetchInventoryData}
              title="Refresh"
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Main View: Tab 1 (Current Stock) */}
      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product Name</th>
                  <th className="py-3 px-3 font-semibold">Item Code</th>
                  <th className="py-3 px-3 font-semibold text-right">In Stock</th>
                  <th className="py-3 px-3 font-semibold text-right">Min Threshold</th>
                  <th className="py-3 px-3 font-semibold text-right">Cost Value</th>
                  <th className="py-3 px-3 font-semibold text-right">Retail Value</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No Inventory Items Found</p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isOutOfStock = p.current_stock <= 0;
                    const isLowStock = p.current_stock <= p.minimum_stock && !isOutOfStock;
                    const costVal = p.purchase_price * p.current_stock;
                    const retailVal = p.selling_price * p.current_stock;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Unit: {p.unit} {p.category_name ? `| ${p.category_name}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">
                          {p.code}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] font-mono ${
                              isOutOfStock
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {p.current_stock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 font-medium">
                          {p.minimum_stock} {p.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600">
                          {formatCurrency(costVal > 0 ? costVal : 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(retailVal > 0 ? retailVal : 0)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-50 text-red-600 border border-red-200">
                              OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200">
                              HEALTHY
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenAdjustment(p)}
                            className="inline-flex items-center gap-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-semibold px-2.5 py-1 rounded-md text-[11px] transition-colors"
                          >
                            <Boxes className="w-3 h-3" />
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main View: Tab 2 (Stock Movement Audit Logs) */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">Product</th>
                  <th className="py-3 px-3 font-semibold">Movement Type</th>
                  <th className="py-3 px-3 font-semibold text-right">Previous</th>
                  <th className="py-3 px-3 font-semibold text-center">Quantity Change</th>
                  <th className="py-3 px-3 font-semibold text-right">New Stock</th>
                  <th className="py-3 px-4 font-semibold">Audit Notes / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No Stock Movements Logged</p>
                      <p className="text-xs text-slate-400">
                        All physical adjustments, purchases, and billing deductions will be audited here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
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
                        <td className="py-3 px-3">
                          {getMovementBadge(m.movement_type)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {m.previous_stock}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-600" />
                            )}
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          {m.current_stock}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {m.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSaved={fetchInventoryData}
        product={selectedProduct}
      />
    </div>
  );
};
