import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  ShoppingBag,
  IndianRupee,
  CreditCard,
  QrCode,
  Percent,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Product, Invoice } from '../types';
import {
  calculateLineItem,
  calculateInvoiceTotals,
  LineItemCalculationResult,
} from '../utils/financialMath';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { invoiceApi } from '../api/invoiceApi';
import { productApi } from '../api/productApi';
import { customerApi } from '../api/customerApi';
import { validateInvoice } from '../utils/validators';

interface CartLineItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  calc: LineItemCalculationResult;
}

export const BillingPage: React.FC = () => {
  // Invoice header
  const [invoiceNumber, setInvoiceNumber] = useState('VND-Loading...');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInterstate, setIsInterstate] = useState(false);

  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  // Catalog & Search state
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart Line Items
  const [cart, setCart] = useState<CartLineItem[]>([]);

  // Bill-level Discount & Payments
  const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState<number>(0);
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved Invoice Modal
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Fetch initial data: Next invoice number, products, customers
  const fetchInitialData = useCallback(async () => {
    try {
      const [nextNum, prodList, custList] = await Promise.all([
        invoiceApi.getNextInvoiceNumber(),
        productApi.getProducts({ stockStatus: 'ALL' }),
        customerApi.getCustomers(),
      ]);
      if (nextNum) setInvoiceNumber(nextNum);
      if (prodList) setProducts(prodList);
      if (custList) setCustomers(custList);
    } catch (err) {
      console.error('[BillingPage] Error fetching initial billing data:', err);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Recalculate cart item when quantity, price, discount or interstate changes
  const updateCartLineCalculation = (
    item: CartLineItem,
    isInter: boolean
  ): CartLineItem => {
    const calc = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      discountAmount: item.discountAmount,
      gstRate: item.gstRate,
      isInterstate: isInter,
    });
    return { ...item, calc };
  };

  // Autocomplete search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.hsn_code && p.hsn_code.includes(q))
    );
    setSearchResults(matches.slice(0, 8));
    setIsSearching(true);
  }, [searchQuery, products]);

  // Add Product to Cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + 1;
        updated[existingIndex] = updateCartLineCalculation(
          { ...existing, quantity: newQty },
          isInterstate
        );
        return updated;
      } else {
        const newItem: CartLineItem = {
          product,
          quantity: 1,
          unitPrice: product.selling_price,
          discountPercent: 0,
          discountAmount: 0,
          gstRate: product.gst_rate,
          calc: calculateLineItem({
            quantity: 1,
            unitPrice: product.selling_price,
            gstRate: product.gst_rate,
            isInterstate,
          }),
        };
        return [...prev, newItem];
      }
    });

    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    searchInputRef.current?.focus();
  };

  // Handle barcode / Enter key press in search bar
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      // Look for exact barcode or code match first
      const exactMatch = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === q) ||
          p.code.toLowerCase() === q
      );

      if (exactMatch) {
        addToCart(exactMatch);
      } else if (searchResults.length > 0) {
        addToCart(searchResults[0]);
      }
    }
  };

  // Modify line item quantity
  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = updateCartLineCalculation(
        { ...updated[index], quantity: newQty },
        isInterstate
      );
      return updated;
    });
  };

  // Modify line item price
  const handlePriceChange = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = updateCartLineCalculation(
        { ...updated[index], unitPrice: newPrice },
        isInterstate
      );
      return updated;
    });
  };

  // Modify line item discount
  const handleDiscountChange = (index: number, val: number, isPercent: boolean) => {
    setCart((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (isPercent) {
        updated[index] = updateCartLineCalculation(
          { ...current, discountPercent: val, discountAmount: 0 },
          isInterstate
        );
      } else {
        updated[index] = updateCartLineCalculation(
          { ...current, discountAmount: val, discountPercent: 0 },
          isInterstate
        );
      }
      return updated;
    });
  };

  // Remove from cart
  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Recalculate whole cart if Interstate mode changes
  const handleToggleInterstate = (checked: boolean) => {
    setIsInterstate(checked);
    setCart((prev) =>
      prev.map((item) => updateCartLineCalculation(item, checked))
    );
  };

  // Customer selection change
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) {
      setCustomerName('Walk-in Customer');
      setCustomerMobile('');
      setCustomerGstin('');
      return;
    }
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerMobile(c.mobile || '');
      setCustomerGstin(c.gstin || '');
    }
  };

  // Compute overall invoice totals
  const totals = calculateInvoiceTotals({
    items: cart.map((c) => c.calc),
    invoiceDiscountPercent,
    invoiceDiscountAmount,
    amountReceived,
  });

  // Validation flags for payment amount
  const isAmountExceeded = totals.grandTotal > 0 && amountReceived > totals.grandTotal;
  const isAmountNegative = amountReceived < 0;

  const handleAmountReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setAmountReceived(0);
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) {
      setAmountReceived(0);
      return;
    }
    if (val < 0) {
      setAmountReceived(0);
      return;
    }
    setAmountReceived(val);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Automatically update amount received when cart total changes if previously full paid
  const handleQuickPayFull = () => {
    setAmountReceived(totals.grandTotal);
  };

  const handleClearBill = () => {
    if (cart.length > 0 && !confirm('Are you sure you want to clear this bill?')) return;
    setCart([]);
    setCustomerName('Walk-in Customer');
    setSelectedCustomerId('');
    setCustomerMobile('');
    setCustomerGstin('');
    setInvoiceDiscountPercent(0);
    setInvoiceDiscountAmount(0);
    setAmountReceived(0);
    setNotes('');
    setErrorMessage(null);
  };

  // Submit Invoice
  const handleFinalizeInvoice = async () => {
    setErrorMessage(null);

    if (amountReceived < 0) {
      setErrorMessage('Negative values are not allowed (எதிர்மறை எண்கள் அனுமதிக்கப்படாது).');
      return;
    }

    if (totals.grandTotal > 0 && amountReceived > totals.grandTotal) {
      setErrorMessage(
        `நீங்கள் மொத்த தொகையை (₹${totals.grandTotal.toFixed(2)}) விட அதிகமாக pay பண்ண போறீங்க! Grand total-ஐ விட அதிகமான தொகையை செலுத்த முடியாது.`
      );
      return;
    }

    const validation = validateInvoice({
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      customerName,
      customerMobile,
      customerGstin,
      paymentMethod,
      amountReceived: Number(amountReceived) || 0,
      grandTotal: totals.grandTotal,
    });

    if (!validation.isValid) {
      setErrorMessage(Object.values(validation.errors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      const now = new Date();
      const invoiceTime = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const payload = {
        invoiceDate,
        invoiceTime,
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        isInterstate,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productCode: item.product.code,
          hsnCode: item.product.hsn_code,
          unit: item.product.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          discountAmount: item.calc.discountAmount,
          taxableValue: item.calc.taxableValue,
          gstRate: item.calc.gstRate,
          cgstRate: item.calc.cgstRate,
          cgstAmount: item.calc.cgstAmount,
          sgstRate: item.calc.sgstRate,
          sgstAmount: item.calc.sgstAmount,
          igstRate: item.calc.igstRate,
          igstAmount: item.calc.igstAmount,
          totalAmount: item.calc.totalAmount,
        })),
        subtotal: totals.subtotal,
        itemDiscountTotal: totals.itemDiscountTotal,
        invoiceDiscountTotal: totals.invoiceDiscountTotal,
        taxableAmount: totals.taxableAmount,
        cgstTotal: totals.cgstTotal,
        sgstTotal: totals.sgstTotal,
        igstTotal: totals.igstTotal,
        grandTotal: totals.grandTotal,
        roundOff: totals.roundOff,
        amountReceived: Number(amountReceived) || 0,
        balanceDue: totals.balanceDue,
        paymentMethod,
        paymentStatus: totals.paymentStatus,
        notes: notes.trim() || undefined,
      };

      const createdInvoice = await invoiceApi.createInvoice(payload);
      setSavedInvoice(createdInvoice);
      setIsInvoiceModalOpen(true);

      // Reset form for next billing and fetch next invoice number
      setCart([]);
      setCustomerName('Walk-in Customer');
      setSelectedCustomerId('');
      setCustomerMobile('');
      setCustomerGstin('');
      setInvoiceDiscountPercent(0);
      setInvoiceDiscountAmount(0);
      setAmountReceived(0);
      setNotes('');
      fetchInitialData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Invoice Number, Date, Customer & Interstate Switch */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-4 gap-4 text-xs">
        {/* Invoice Number & Date */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Invoice Number</div>
            <div className="font-mono font-bold text-slate-800 text-sm">{invoiceNumber}</div>
            <div className="text-[10px] text-slate-500">{invoiceDate}</div>
          </div>
        </div>

        {/* Customer Select / Input */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">
              Customer Select
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.mobile})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">
              Customer Name
            </label>
            <input
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">
              Mobile Number
            </label>
            <input
              type="text"
              placeholder="10-digit mobile"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Place of supply: Intra-state vs Inter-state */}
        <div className="flex items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 pt-2 lg:pt-0">
          <div className="text-right">
            <div className="font-semibold text-slate-700">Inter-State (IGST)</div>
            <div className="text-[10px] text-slate-400">
              {isInterstate ? '100% IGST applied' : 'CGST (50%) + SGST (50%)'}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isInterstate}
              onChange={(e) => handleToggleInterstate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Product Search & Cart Line Items Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barcode & Product Search Input */}
          <div className="relative bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or search product by name, code... (Press Enter to add)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>

            {/* Instant Search Dropdown Results */}
            {isSearching && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="p-2.5 hover:bg-blue-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Code: <span className="font-mono">{p.code}</span> | GST: {p.gst_rate}% | Stock:{' '}
                        <strong className={p.current_stock <= p.minimum_stock ? 'text-amber-600' : 'text-emerald-600'}>
                          {p.current_stock} {p.unit}
                        </strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{p.selling_price.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-blue-600 font-semibold">+ Add Item</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Line Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs text-slate-800">
                  Cart Line Items ({cart.length})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearBill}
                  className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Cart
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center w-28">Quantity</th>
                    <th className="py-2.5 px-2 text-right w-24">Price (₹)</th>
                    <th className="py-2.5 px-2 text-right w-20">Disc (%)</th>
                    <th className="py-2.5 px-2 text-right">Taxable</th>
                    <th className="py-2.5 px-2 text-center">GST</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">Bill is empty</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Scan barcode or search products above to start billing.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={item.product.id} className="hover:bg-slate-50/60">
                        {/* Name & Code */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{item.product.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.product.code} {item.product.hsn_code ? `| HSN: ${item.product.hsn_code}` : ''}
                          </div>
                        </td>

                        {/* Quantity with +/- */}
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <button
                              onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                              className="p-1 hover:bg-slate-200 text-slate-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                              className="w-10 text-center font-bold text-xs bg-transparent border-0 focus:outline-none"
                            />
                            <button
                              onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                              className="p-1 hover:bg-slate-200 text-slate-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {item.quantity > item.product.current_stock && (
                            <div className="text-[9px] text-red-500 font-medium mt-0.5">
                              Exceeds stock ({item.product.current_stock})
                            </div>
                          )}
                        </td>

                        {/* Unit Price */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                            className="w-20 p-1 text-right bg-slate-50 border border-slate-200 rounded font-mono font-medium text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                            }}
                            value={item.discountPercent}
                            onChange={(e) => handleDiscountChange(idx, Math.max(0, Math.min(100, Number(e.target.value) || 0)), true)}
                            className="w-14 p-1 text-right bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Taxable Value */}
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                          ₹{item.calc.taxableValue.toFixed(2)}
                        </td>

                        {/* GST Rate & Tax Amount */}
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {item.calc.gstRate}%
                          </span>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            ₹{item.calc.totalTax.toFixed(2)}
                          </div>
                        </td>

                        {/* Total Line Amount */}
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 text-xs">
                          ₹{item.calc.totalAmount.toFixed(2)}
                        </td>

                        {/* Remove */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleRemoveFromCart(idx)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Billing Summary & Payment Processing */}
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Financial Calculation Breakdown Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">
              Bill Summary
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross)</span>
                <span className="font-mono font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.itemDiscountTotal > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Item Discounts</span>
                  <span className="font-mono text-emerald-600">
                    -{formatCurrency(totals.itemDiscountTotal)}
                  </span>
                </div>
              )}

              {/* Bill-level Discount Input */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-600">Bill Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceDiscountAmount || ''}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setInvoiceDiscountAmount(val);
                    setInvoiceDiscountPercent(0);
                  }}
                  placeholder="0.00"
                  className="w-24 p-1 text-right bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                />
              </div>

              <div className="flex justify-between text-slate-700 font-medium border-t border-slate-200 pt-2">
                <span>Net Taxable Value</span>
                <span className="font-mono">{formatCurrency(totals.taxableAmount)}</span>
              </div>

              {/* GST Breakdown */}
              {!isInterstate ? (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>CGST Total</span>
                    <span className="font-mono">{formatCurrency(totals.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>SGST Total</span>
                    <span className="font-mono">{formatCurrency(totals.sgstTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>IGST Total</span>
                  <span className="font-mono">{formatCurrency(totals.igstTotal)}</span>
                </div>
              )}

              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Round Off</span>
                  <span className="font-mono">
                    {totals.roundOff > 0 ? `+${totals.roundOff.toFixed(2)}` : totals.roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-t-2 border-slate-300 pt-3">
                <span>Grand Total</span>
                <span className="text-xl font-mono text-blue-600">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
            <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">
              Payment Settlement
            </h4>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none"
              >
                <option value="CASH">Cash Payment</option>
                <option value="UPI">UPI / QR Payment (GPay, PhonePe, Paytm)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="OTHER">Other Mode</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-semibold">Amount Received (₹)</label>
                <button
                  type="button"
                  onClick={handleQuickPayFull}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold"
                >
                  Exact Cash (₹{totals.grandTotal})
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max={totals.grandTotal > 0 ? totals.grandTotal : undefined}
                value={amountReceived === 0 ? '' : amountReceived}
                onChange={handleAmountReceivedChange}
                onKeyDown={handleAmountKeyDown}
                placeholder="0.00"
                className={`w-full p-2 rounded-lg font-bold text-base font-mono focus:outline-none transition-colors ${
                  isAmountExceeded || isAmountNegative
                    ? 'bg-red-50 border-2 border-red-500 text-red-700 focus:ring-2 focus:ring-red-500/20'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />

              {isAmountExceeded && (
                <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mt-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">
                      நீங்கள் மொத்த தொகையை விட அதிகமாக pay பண்ண போறீங்க!
                    </span>
                    <span className="text-[11px] text-red-600">
                      அதிகபட்ச தொகை: ₹{totals.grandTotal.toFixed(2)} (Amount cannot exceed Grand Total)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickPayFull}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shrink-0 self-center transition-colors"
                  >
                    Set ₹{totals.grandTotal}
                  </button>
                </div>
              )}

              {isAmountNegative && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mt-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Negative values are not allowed (எதிர்மறை எண்கள் அனுமதிக்கப்படாது).</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Balance Due:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    totals.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {formatCurrency(totals.balanceDue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    totals.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : totals.paymentStatus === 'PARTIAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {totals.paymentStatus}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[11px] mb-1">
                Bill Notes <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Reference info..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Finalize Button */}
            <button
              onClick={handleFinalizeInvoice}
              disabled={isSubmitting || cart.length === 0 || isAmountExceeded || isAmountNegative}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Finalizing Invoice...' : 'Save & Print Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Post-Save Invoice Detail & Print Modal */}
      <InvoiceDetailModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={savedInvoice}
      />
    </div>
  );
};
