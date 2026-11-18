import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, Tag, Check, AlertCircle } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const list = await window.electronAPI.getProducts();
        setProducts(list || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">
            Total: <strong className="text-slate-800">{filtered.length}</strong> products
          </span>
          <button
            onClick={() => alert('Product addition module will be active in Phase 2!')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Item Details</th>
                <th className="py-3 px-3 font-semibold">Code / Barcode</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold text-right">Cost Price</th>
                <th className="py-3 px-3 font-semibold text-right">Selling Price</th>
                <th className="py-3 px-3 font-semibold text-center">GST Rate</th>
                <th className="py-3 px-4 font-semibold text-right">Current Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-400">Unit: {item.unit} {item.hsn_code ? `| HSN: ${item.hsn_code}` : ''}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    <div>{item.code}</div>
                    {item.barcode && <div className="text-[10px] text-slate-400">{item.barcode}</div>}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {item.category_name || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 font-medium">
                    ₹{Number(item.purchase_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-800 font-bold">
                    ₹{Number(item.selling_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                      {item.gst_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        item.current_stock <= item.minimum_stock
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.current_stock} {item.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
