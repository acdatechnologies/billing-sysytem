import React, { useState, useEffect } from 'react';
import { X, Save, Boxes, PlusCircle, MinusCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Product, StockAdjustmentInput } from '../types';
import { inventoryApi } from '../api/inventoryApi';
import { validateStockAdjustment } from '../utils/validators';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: Product | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  product,
}) => {
  const [movementType, setMovementType] = useState<'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'RETURN'>('RESTOCK');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setMovementType('RESTOCK');
      setQuantity(1);
      setNotes('');
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.current_stock) || 0;

  // Calculate resulting stock preview
  let resultingStock = currentStock;
  const numQty = Number(quantity) || 0;

  if (movementType === 'RESTOCK' || movementType === 'RETURN') {
    resultingStock = currentStock + numQty;
  } else if (movementType === 'DAMAGE') {
    resultingStock = currentStock - numQty;
  } else if (movementType === 'CORRECTION') {
    resultingStock = numQty;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mappedType = movementType === 'CORRECTION' ? 'AUDIT_CORRECTION' : movementType;

    const validation = validateStockAdjustment({
      productId: product.id,
      movementType: mappedType,
      quantity: numQty,
      currentStock,
      notes: notes.trim(),
    });

    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryApi.adjustStock({
        productId: product.id,
        movementType: mappedType as any,
        quantity: numQty,
        reason: mappedType,
        notes: notes.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Adjust Physical Stock</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Record stock intake, damage or audit corrections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Details Header Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{product.name}</h4>
            <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
              <span>Code: <strong className="font-mono text-slate-700">{product.code}</strong></span>
              <span>&bull;</span>
              <span>Unit: <strong>{product.unit}</strong></span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Stock</div>
            <div className="text-base font-bold text-slate-800 font-mono">
              {currentStock} {product.unit}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Movement Type Radio Cards */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Reason / Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('RESTOCK')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${
                  movementType === 'RESTOCK'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Restock Intake</div>
                  <div className="text-[10px] text-slate-500">Purchase / new shipment</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('DAMAGE')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${
                  movementType === 'DAMAGE'
                    ? 'border-red-600 bg-red-50/70 text-red-900 ring-1 ring-red-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <MinusCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Damage / Expiry</div>
                  <div className="text-[10px] text-slate-500">Deduct broken or lost units</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('CORRECTION')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${
                  movementType === 'CORRECTION'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Boxes className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Count Correction</div>
                  <div className="text-[10px] text-slate-500">Set exact verified count</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('RETURN')}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all ${
                  movementType === 'RETURN'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Customer Return</div>
                  <div className="text-[10px] text-slate-500">Restock returned item</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {movementType === 'CORRECTION'
                ? 'Exact Physical Count in Stock'
                : 'Quantity to Add / Deduct'}
            </label>
            <input
              type="number"
              step="1"
              min={movementType === 'CORRECTION' ? '0' : '1'}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Live Resulting Stock Preview Box */}
          <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="text-slate-600 font-medium">Stock Preview:</div>
            <div className="flex items-center gap-2 font-mono font-bold text-xs">
              <span className="text-slate-600">{currentStock}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`px-2 py-0.5 rounded ${
                  resultingStock <= 0
                    ? 'bg-red-100 text-red-700'
                    : resultingStock <= product.minimum_stock
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {resultingStock} {product.unit}
              </span>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason / Reference Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Supplier PO-492, shelf count discrepancy, customer return..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
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
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white px-5 py-2 rounded-lg font-semibold shadow-xs shadow-cyan-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Save Stock Adjustment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
