import Decimal from 'decimal.js';

// Configure Decimal precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface LineItemCalculationInput {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  gstRate: number;
  isInterstate?: boolean;
}

export interface LineItemCalculationResult {
  grossAmount: number;
  discountAmount: number;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const qty = new Decimal(input.quantity || 0);
  const price = new Decimal(input.unitPrice || 0);
  const gross = qty.times(price);

  let discount = new Decimal(0);
  if (input.discountPercent && input.discountPercent > 0) {
    discount = gross.times(new Decimal(input.discountPercent)).dividedBy(100);
  } else if (input.discountAmount && input.discountAmount > 0) {
    discount = Decimal.min(gross, new Decimal(input.discountAmount));
  }

  const taxable = Decimal.max(0, gross.minus(discount));
  const gstRate = new Decimal(input.gstRate || 0);

  let cgstRate = new Decimal(0);
  let cgstAmount = new Decimal(0);
  let sgstRate = new Decimal(0);
  let sgstAmount = new Decimal(0);
  let igstRate = new Decimal(0);
  let igstAmount = new Decimal(0);

  if (input.isInterstate) {
    igstRate = gstRate;
    igstAmount = taxable.times(igstRate).dividedBy(100);
  } else {
    cgstRate = gstRate.dividedBy(2);
    sgstRate = gstRate.dividedBy(2);
    cgstAmount = taxable.times(cgstRate).dividedBy(100);
    sgstAmount = taxable.times(sgstRate).dividedBy(100);
  }

  const totalTax = cgstAmount.plus(sgstAmount).plus(igstAmount);
  const totalAmount = taxable.plus(totalTax);

  return {
    grossAmount: gross.toDecimalPlaces(2).toNumber(),
    discountAmount: discount.toDecimalPlaces(2).toNumber(),
    taxableValue: taxable.toDecimalPlaces(2).toNumber(),
    gstRate: gstRate.toNumber(),
    cgstRate: cgstRate.toNumber(),
    cgstAmount: cgstAmount.toDecimalPlaces(2).toNumber(),
    sgstRate: sgstRate.toNumber(),
    sgstAmount: sgstAmount.toDecimalPlaces(2).toNumber(),
    igstRate: igstRate.toNumber(),
    igstAmount: igstAmount.toDecimalPlaces(2).toNumber(),
    totalTax: totalTax.toDecimalPlaces(2).toNumber(),
    totalAmount: totalAmount.toDecimalPlaces(2).toNumber(),
  };
}

export interface InvoiceTotalsCalculationInput {
  items: LineItemCalculationResult[];
  invoiceDiscountPercent?: number;
  invoiceDiscountAmount?: number;
  amountReceived?: number;
}

export interface InvoiceTotalsCalculationResult {
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountTotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  unroundedTotal: number;
  roundOff: number;
  grandTotal: number;
  amountReceived: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export function calculateInvoiceTotals(input: InvoiceTotalsCalculationInput): InvoiceTotalsCalculationResult {
  let subtotal = new Decimal(0);
  let itemDiscountTotal = new Decimal(0);
  let taxableAmount = new Decimal(0);
  let cgstTotal = new Decimal(0);
  let sgstTotal = new Decimal(0);
  let igstTotal = new Decimal(0);

  for (const item of input.items) {
    subtotal = subtotal.plus(new Decimal(item.grossAmount));
    itemDiscountTotal = itemDiscountTotal.plus(new Decimal(item.discountAmount));
    taxableAmount = taxableAmount.plus(new Decimal(item.taxableValue));
    cgstTotal = cgstTotal.plus(new Decimal(item.cgstAmount));
    sgstTotal = sgstTotal.plus(new Decimal(item.sgstAmount));
    igstTotal = igstTotal.plus(new Decimal(item.igstAmount));
  }

  let invoiceDiscount = new Decimal(0);
  if (input.invoiceDiscountPercent && input.invoiceDiscountPercent > 0) {
    invoiceDiscount = taxableAmount.times(new Decimal(input.invoiceDiscountPercent)).dividedBy(100);
  } else if (input.invoiceDiscountAmount && input.invoiceDiscountAmount > 0) {
    invoiceDiscount = Decimal.min(taxableAmount, new Decimal(input.invoiceDiscountAmount));
  }

  const netTaxable = Decimal.max(0, taxableAmount.minus(invoiceDiscount));
  const totalTax = cgstTotal.plus(sgstTotal).plus(igstTotal);
  const unroundedTotal = netTaxable.plus(totalTax);

  // Standard Indian currency rounding to nearest Rupee
  const roundedGrand = new Decimal(Math.round(unroundedTotal.toNumber()));
  const roundOff = roundedGrand.minus(unroundedTotal);

  // Partial pay removed: All billing transactions are settled in full
  const received = roundedGrand;
  const balance = new Decimal(0);
  const paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = roundedGrand.greaterThan(0) ? 'PAID' : 'PAID';

  return {
    subtotal: subtotal.toDecimalPlaces(2).toNumber(),
    itemDiscountTotal: itemDiscountTotal.toDecimalPlaces(2).toNumber(),
    invoiceDiscountTotal: invoiceDiscount.toDecimalPlaces(2).toNumber(),
    totalDiscount: itemDiscountTotal.plus(invoiceDiscount).toDecimalPlaces(2).toNumber(),
    taxableAmount: netTaxable.toDecimalPlaces(2).toNumber(),
    cgstTotal: cgstTotal.toDecimalPlaces(2).toNumber(),
    sgstTotal: sgstTotal.toDecimalPlaces(2).toNumber(),
    igstTotal: igstTotal.toDecimalPlaces(2).toNumber(),
    totalTax: totalTax.toDecimalPlaces(2).toNumber(),
    unroundedTotal: unroundedTotal.toDecimalPlaces(2).toNumber(),
    roundOff: roundOff.toDecimalPlaces(2).toNumber(),
    grandTotal: roundedGrand.toNumber(),
    amountReceived: roundedGrand.toNumber(),
    balanceDue: 0,
    paymentStatus: 'PAID',
  };
}
