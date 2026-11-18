import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, MapPin, FileCheck } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const list = await window.electronAPI.getCustomers();
        setCustomers(list || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">
            Total: <strong className="text-slate-800">{filtered.length}</strong> customers
          </span>
          <button
            onClick={() => alert('Customer registration module will be active in Phase 4!')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-3 font-semibold">Contact</th>
                <th className="py-3 px-3 font-semibold">GSTIN</th>
                <th className="py-3 px-3 font-semibold">Address / State</th>
                <th className="py-3 px-3 font-semibold text-center">Bills</th>
                <th className="py-3 px-4 font-semibold text-right">Total Purchases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-400">ID: {c.id}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.mobile}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {c.gstin ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div className="truncate max-w-[200px]">{c.address || '—'}</div>
                    <div className="text-[10px] text-slate-400">{c.state || 'Tamil Nadu'}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">
                      {c.total_bills || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">
                    ₹{Number(c.total_purchases || 0).toFixed(2)}
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
