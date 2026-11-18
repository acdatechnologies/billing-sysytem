import React, { useState } from 'react';
import { X, Printer, Download, Share2, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import { Invoice } from '../types';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onCancelInvoice?: (invoiceId: string, reason: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onCancelInvoice,
}) => {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  if (!isOpen || !invoice) return null;

  const isCancelled = invoice.status === 'CANCELLED';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmCancel = () => {
    if (onCancelInvoice) {
      onCancelInvoice(invoice.id, cancellationReason.trim() || 'Customer requested return / order cancelled');
      setShowCancelPrompt(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              Invoice #{invoice.invoice_number}
              {isCancelled ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  CANCELLED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ACTIVE
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>

            {!isCancelled && onCancelInvoice && (
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Bill</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cancellation Prompt Modal Overlay */}
        {showCancelPrompt && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-xs space-y-2">
            <div className="font-bold text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Confirm Invoice Cancellation & Stock Reversal</span>
            </div>
            <p className="text-red-700">
              Cancelling this invoice will automatically restore all sold quantities back into available inventory and reverse the customer total. This cannot be undone.
            </p>
            <input
              type="text"
              placeholder="Reason for cancellation (e.g. customer returned item, wrong billing)..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full p-2 bg-white border border-red-300 rounded text-slate-800 text-xs"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowCancelPrompt(false)}
                className="px-3 py-1 text-slate-600 hover:bg-red-100 rounded"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-3 py-1 bg-red-600 text-white font-semibold rounded shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        )}

        {/* Invoice Printable View */}
        <div id="printable-invoice" className="p-8 text-xs text-slate-800 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Header Section */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {invoice.business?.name || 'VND Tech Enterprises'}
              </h2>
              <p className="text-slate-500 mt-0.5">{invoice.business?.address}</p>
              <div className="text-slate-500 mt-1 flex flex-wrap gap-x-4">
                <span>Phone: <strong>{invoice.business?.phone || '88255 08237'}</strong></span>
                <span>Email: <strong>{invoice.business?.email || 'contact@vndtech.in'}</strong></span>
              </div>
              {invoice.business?.gstin && (
                <p className="font-semibold text-slate-700 mt-1">
                  GSTIN: <span className="font-mono">{invoice.business.gstin}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded inline-block">
                Tax Invoice
              </div>
              <h3 className="text-lg font-mono font-bold text-slate-900 mt-2">
                #{invoice.invoice_number}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Date: <strong>{invoice.invoice_date}</strong> {invoice.invoice_time && `at ${invoice.invoice_time}`}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Place of Supply: <strong>{invoice.is_interstate ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'}</strong>
              </p>
            </div>
          </div>

          {/* Billed To (Customer Details) */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Billed To (Customer)
              </span>
              <h4 className="font-bold text-sm text-slate-800">{invoice.customer_name}</h4>
              {invoice.customer_mobile && (
                <p className="text-slate-600 mt-0.5">
                  Mobile: <strong className="font-mono">{invoice.customer_mobile}</strong>
                </p>
              )}
            </div>

            {invoice.customer_gstin && (
              <div className="sm:text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Customer GSTIN
                </span>
                <span className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                  {invoice.customer_gstin}
                </span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-2">HSN</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-right">Disc</th>
                  <th className="py-2.5 px-2 text-right">Taxable</th>
                  <th className="py-2.5 px-2 text-center">GST</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{item.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">{item.hsn_code || '—'}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                      ₹{item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500 font-mono">
                      {item.discount_amount > 0 ? `₹${item.discount_amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      ₹{item.taxable_value.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                        {item.gst_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{item.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Calculation Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment & Terms Section */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-bold text-slate-800 uppercase">{invoice.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Amount Received:</span>
                  <span className="font-bold text-emerald-700 font-mono">{formatCurrency(invoice.amount_received)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-1">
                  <span className="text-slate-500 font-medium">Balance Due:</span>
                  <span className="font-bold text-red-600 font-mono">{formatCurrency(invoice.balance_due)}</span>
                </div>
              </div>

              {invoice.notes && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-700">Notes:</strong> {invoice.notes}
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross)</span>
                <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.item_discount_total > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Item Discounts</span>
                  <span className="font-mono text-emerald-600">-{formatCurrency(invoice.item_discount_total)}</span>
                </div>
              )}

              {invoice.invoice_discount_total > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Invoice Discount</span>
                  <span className="font-mono text-emerald-600">-{formatCurrency(invoice.invoice_discount_total)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 font-medium border-t border-slate-200 pt-1">
                <span>Taxable Amount</span>
                <span className="font-mono">{formatCurrency(invoice.taxable_amount)}</span>
              </div>

              {!invoice.is_interstate ? (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>CGST</span>
                    <span className="font-mono">{formatCurrency(invoice.cgst_total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>SGST</span>
                    <span className="font-mono">{formatCurrency(invoice.sgst_total)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>IGST</span>
                  <span className="font-mono">{formatCurrency(invoice.igst_total)}</span>
                </div>
              )}

              {invoice.round_off !== 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Round Off</span>
                  <span className="font-mono">{invoice.round_off > 0 ? `+${invoice.round_off.toFixed(2)}` : invoice.round_off.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-300 pt-2">
                <span>Grand Total</span>
                <span className="font-mono text-base text-blue-600">{formatCurrency(invoice.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Standard VND Tech Invoice Footer (Required by Section 3) */}
          <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 space-y-0.5">
            <p className="font-bold text-slate-700">Powered by VND Tech</p>
            <p>Billing Software | Business Technology Solutions</p>
            <p>
              Website: <span className="font-medium text-slate-700">vndtech.in</span> &bull; Contact:{' '}
              <span className="font-medium text-slate-700">88255 08237</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
