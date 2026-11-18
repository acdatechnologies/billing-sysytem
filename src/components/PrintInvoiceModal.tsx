import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Receipt,
  Settings,
} from 'lucide-react';
import { Invoice, PrinterDevice } from '../types';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  defaultPaperFormat?: '58mm' | '80mm' | 'A4' | 'A5';
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  defaultPaperFormat = 'A4',
}) => {
  const [paperFormat, setPaperFormat] = useState<'58mm' | '80mm' | 'A4' | 'A5'>(defaultPaperFormat);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isSilent, setIsSilent] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (invoice?.business?.paper_size) {
        setPaperFormat(invoice.business.paper_size as any);
      }
      // Load installed printers
      if (window.electronAPI) {
        window.electronAPI
          .getInstalledPrinters()
          .then((list) => {
            setPrinters(list || []);
            const defaultP = list?.find((p) => p.isDefault);
            if (defaultP) setSelectedPrinter(defaultP.name);
          })
          .catch(console.error);
      }
      setFeedback(null);
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const getPrintHtml = (): string => {
    if (!previewRef.current) return '';
    return previewRef.current.innerHTML;
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      setFeedback(null);

      const htmlContent = getPrintHtml();
      if (window.electronAPI) {
        const result = await window.electronAPI.printInvoice({
          printerName: selectedPrinter || undefined,
          silent: isSilent,
          paperFormat,
          htmlContent,
        });

        if (result.success) {
          setFeedback({ type: 'success', message: result.message || 'Invoice printed successfully!' });
        } else {
          setFeedback({ type: 'error', message: result.message || 'Failed to print invoice.' });
        }
      } else {
        window.print();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Printing error.' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      setFeedback(null);

      const htmlContent = getPrintHtml();
      const defaultFileName = `Invoice_${invoice.invoice_number.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

      if (window.electronAPI) {
        const result = await window.electronAPI.exportPDF({
          htmlContent,
          paperFormat,
          defaultFileName,
        });

        if (result.success) {
          setFeedback({ type: 'success', message: `PDF saved successfully at: ${result.filePath}` });
        } else {
          setFeedback({ type: 'error', message: result.message || 'PDF export cancelled or failed.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to export PDF.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[90vh]">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                Invoice Print & PDF Generator
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">#{invoice.invoice_number}</p>
            </div>
          </div>

          {/* Paper Format Switcher Tabs */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPaperFormat('58mm')}
              className={`px-3 py-1 rounded-md transition-all ${
                paperFormat === '58mm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm Thermal
            </button>
            <button
              onClick={() => setPaperFormat('80mm')}
              className={`px-3 py-1 rounded-md transition-all ${
                paperFormat === '80mm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setPaperFormat('A4')}
              className={`px-3 py-1 rounded-md transition-all ${
                paperFormat === 'A4'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Standard
            </button>
            <button
              onClick={() => setPaperFormat('A5')}
              className={`px-3 py-1 rounded-md transition-all ${
                paperFormat === 'A5'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A5 Compact
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Control Bar: Printer Selection & Actions */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-slate-600">Select Printer:</label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="p-1.5 bg-white border border-slate-300 rounded-md font-medium text-slate-800"
            >
              <option value="">Default System Printer</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={isSilent}
                onChange={(e) => setIsSilent(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span>Silent Print (No Dialog)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{isExporting ? 'Exporting...' : 'Save as PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Printing...' : 'Print Now'}</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200/50 flex justify-center">
          <div
            ref={previewRef}
            className={`bg-white shadow-lg transition-all ${
              paperFormat === '58mm'
                ? 'w-[220px] p-3 text-[10px] font-mono leading-tight'
                : paperFormat === '80mm'
                ? 'w-[310px] p-4 text-[11px] font-mono leading-normal'
                : paperFormat === 'A5'
                ? 'w-[560px] p-8 text-xs font-sans'
                : 'w-[720px] p-10 text-xs font-sans'
            }`}
          >
            {/* Template A: Thermal Formats (58mm and 80mm) */}
            {paperFormat.endsWith('mm') ? (
              <div className="space-y-2 text-slate-900">
                {/* Store Header */}
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <div className="font-bold text-sm tracking-tight">
                    {invoice.business?.name || 'VND Tech Enterprises'}
                  </div>
                  <div className="text-[10px]">{invoice.business?.address}</div>
                  <div className="text-[10px]">
                    Phone: {invoice.business?.phone || '88255 08237'}
                  </div>
                  {invoice.business?.gstin && (
                    <div className="text-[10px] font-bold">
                      GSTIN: {invoice.business.gstin}
                    </div>
                  )}
                  <div className="font-bold text-[10px] pt-1 uppercase">
                    Tax Invoice
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <div className="flex justify-between">
                    <span>Inv #:</span>
                    <span className="font-bold">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{invoice.invoice_date} {invoice.invoice_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold truncate max-w-[140px]">{invoice.customer_name}</span>
                  </div>
                  {invoice.customer_mobile && (
                    <div className="flex justify-between">
                      <span>Mobile:</span>
                      <span>{invoice.customer_mobile}</span>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div className="border-b border-dashed border-slate-400 pb-2">
                  <div className="flex justify-between font-bold border-b border-dashed border-slate-300 pb-1 mb-1 text-[10px]">
                    <span>Item</span>
                    <span>Qty &times; Price</span>
                    <span>Total</span>
                  </div>
                  {invoice.items?.map((item) => (
                    <div key={item.id} className="mb-1">
                      <div className="font-semibold truncate">{item.product_name}</div>
                      <div className="flex justify-between text-[10px] text-slate-700">
                        <span>
                          {item.quantity} {item.unit} &times; ₹{item.unit_price.toFixed(2)}
                        </span>
                        <span className="font-bold font-mono">₹{item.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Totals */}
                <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.item_discount_total > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-₹{invoice.item_discount_total.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Taxable:</span>
                    <span>₹{invoice.taxable_amount.toFixed(2)}</span>
                  </div>
                  {!invoice.is_interstate ? (
                    <>
                      <div className="flex justify-between">
                        <span>CGST:</span>
                        <span>₹{invoice.cgst_total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST:</span>
                        <span>₹{invoice.sgst_total.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>IGST:</span>
                      <span>₹{invoice.igst_total.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.round_off !== 0 && (
                    <div className="flex justify-between">
                      <span>Round Off:</span>
                      <span>{invoice.round_off > 0 ? `+${invoice.round_off.toFixed(2)}` : invoice.round_off.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-slate-300">
                    <span>GRAND TOTAL:</span>
                    <span>₹{invoice.grand_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Payment Mode:</span>
                    <span>{invoice.payment_method}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Paid / Due:</span>
                    <span>
                      ₹{invoice.amount_received.toFixed(2)} / ₹{invoice.balance_due.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Standard VND Tech Invoice Footer (Required by Section 3) */}
                <div className="text-center pt-2 text-[9px] leading-tight space-y-0.5 text-slate-600">
                  <div className="font-bold text-slate-800">Powered by VND Tech</div>
                  <div>Billing Software | Business Technology Solutions</div>
                  <div>Website: vndtech.in | Contact: 88255 08237</div>
                  <div className="pt-1 font-semibold text-slate-700">Thank you for your visit!</div>
                </div>
              </div>
            ) : (
              /* Template B: Formal Standard Formats (A4 and A5) */
              <div className="space-y-6 text-slate-900 border border-slate-300 p-6 rounded-lg">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      {invoice.business?.name || 'VND Tech Enterprises'}
                    </h1>
                    <p className="text-slate-600 text-xs mt-0.5">{invoice.business?.address}</p>
                    <div className="text-slate-600 text-xs mt-1">
                      Phone: <strong>{invoice.business?.phone || '88255 08237'}</strong> &bull; Email:{' '}
                      <strong>{invoice.business?.email || 'contact@vndtech.in'}</strong>
                    </div>
                    {invoice.business?.gstin && (
                      <div className="font-bold text-xs text-slate-800 mt-1">
                        GSTIN: <span className="font-mono">{invoice.business.gstin}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs uppercase tracking-wider rounded inline-block">
                      TAX INVOICE
                    </span>
                    <div className="text-lg font-mono font-bold text-slate-900 mt-2">
                      #{invoice.invoice_number}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Date: <strong>{invoice.invoice_date}</strong> {invoice.invoice_time}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Supply: <strong>{invoice.is_interstate ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'}</strong>
                    </div>
                  </div>
                </div>

                {/* Billed To Customer */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Billed To
                    </span>
                    <div className="font-bold text-slate-900 text-sm">{invoice.customer_name}</div>
                    {invoice.customer_mobile && (
                      <div className="text-slate-600 font-mono">Mobile: {invoice.customer_mobile}</div>
                    )}
                  </div>
                  {invoice.customer_gstin && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Customer GSTIN
                      </span>
                      <div className="font-mono font-bold text-slate-800">{invoice.customer_gstin}</div>
                    </div>
                  )}
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-8">#</th>
                      <th className="p-2">Item Description</th>
                      <th className="p-2">HSN</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Taxable</th>
                      <th className="p-2 text-center">GST</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items?.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-semibold text-slate-900">{item.product_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                        </td>
                        <td className="p-2 font-mono text-slate-600">{item.hsn_code || '—'}</td>
                        <td className="p-2 text-right font-bold text-slate-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          ₹{item.unit_price.toFixed(2)}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          ₹{item.taxable_value.toFixed(2)}
                        </td>
                        <td className="p-2 text-center font-medium text-slate-700">
                          {item.gst_rate}%
                        </td>
                        <td className="p-2 text-right font-bold font-mono text-slate-900">
                          ₹{item.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals & Tax Matrix */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="text-xs text-slate-600 space-y-2">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span>Payment Mode:</span>
                        <strong className="text-slate-800 uppercase">{invoice.payment_method}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <strong className="text-emerald-700 font-mono">₹{invoice.amount_received.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance Due:</span>
                        <strong className="text-red-600 font-mono">₹{invoice.balance_due.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      <strong>Terms & Conditions:</strong>
                      <p className="whitespace-pre-line mt-0.5">
                        {invoice.business?.terms_and_conditions ||
                          '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Subject to local jurisdiction.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Gross:</span>
                      <span className="font-mono">₹{invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.item_discount_total > 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Item Discounts:</span>
                        <span className="font-mono text-emerald-600">-₹{invoice.item_discount_total.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1">
                      <span>Taxable Value:</span>
                      <span className="font-mono">₹{invoice.taxable_amount.toFixed(2)}</span>
                    </div>
                    {!invoice.is_interstate ? (
                      <>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>CGST:</span>
                          <span className="font-mono">₹{invoice.cgst_total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>SGST:</span>
                          <span className="font-mono">₹{invoice.sgst_total.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>IGST:</span>
                        <span className="font-mono">₹{invoice.igst_total.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.round_off !== 0 && (
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Round Off:</span>
                        <span className="font-mono">{invoice.round_off > 0 ? `+${invoice.round_off.toFixed(2)}` : invoice.round_off.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-t-2 border-slate-300 pt-2">
                      <span>Grand Total:</span>
                      <span className="text-base text-blue-600 font-mono">₹{invoice.grand_total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Standard VND Tech Invoice Footer (Required by Section 3) */}
                <div className="border-t border-slate-300 pt-4 text-center text-[10px] text-slate-500 space-y-0.5">
                  <div className="font-bold text-slate-800">Powered by VND Tech</div>
                  <div>Billing Software | Business Technology Solutions</div>
                  <div>
                    Website: <span className="font-medium text-slate-700">vndtech.in</span> &bull; Contact:{' '}
                    <span className="font-medium text-slate-700">88255 08237</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
