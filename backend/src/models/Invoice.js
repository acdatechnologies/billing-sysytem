import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productCode: { type: String, required: true },
  hsnCode: { type: String },
  unit: { type: String, default: 'PCS' },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableValue: { type: Number, required: true },
  gstRate: { type: Number, required: true },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
});

invoiceItemSchema.pre('validate', function (next) {
  if (!this.productId && this.get('product_id')) this.productId = this.get('product_id');
  if (!this.productName && this.get('product_name')) this.productName = this.get('product_name');
  if (!this.productCode && this.get('product_code')) this.productCode = this.get('product_code');
  if (this.unitPrice === undefined && this.get('unit_price') !== undefined) this.unitPrice = Number(this.get('unit_price'));
  if (this.taxableValue === undefined && this.get('taxable_value') !== undefined) this.taxableValue = Number(this.get('taxable_value'));
  if (this.gstRate === undefined && this.get('gst_rate') !== undefined) this.gstRate = Number(this.get('gst_rate'));
  if (this.totalAmount === undefined && this.get('total_amount') !== undefined) this.totalAmount = Number(this.get('total_amount'));
  next();
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: String, required: true },
    invoiceTime: { type: String, required: true },
    customerId: { type: String },
    customerName: { type: String, required: true },
    customerMobile: { type: String },
    customerGstin: { type: String },
    isInterstate: { type: Boolean, default: false },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    itemDiscountTotal: { type: Number, default: 0 },
    invoiceDiscountTotal: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    roundOff: { type: Number, default: 0 },
    amountReceived: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    status: { type: String, default: 'ACTIVE' },
    notes: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: String },
    updatedAtLocal: { type: String, required: true },
  },
  { timestamps: true }
);

invoiceSchema.pre('validate', function (next) {
  if (!this.invoiceId && this.get('id')) this.invoiceId = this.get('id');
  if (!this.invoiceNumber && this.get('invoice_number')) this.invoiceNumber = this.get('invoice_number');
  if (!this.invoiceDate && this.get('invoice_date')) this.invoiceDate = this.get('invoice_date');
  if (!this.invoiceTime && this.get('invoice_time')) this.invoiceTime = this.get('invoice_time');
  if (!this.customerId && this.get('customer_id')) this.customerId = this.get('customer_id');
  if (!this.customerName && this.get('customer_name')) this.customerName = this.get('customer_name');
  if (!this.customerMobile && this.get('customer_mobile')) this.customerMobile = this.get('customer_mobile');
  if (!this.customerGstin && this.get('customer_gstin')) this.customerGstin = this.get('customer_gstin');
  if (this.subtotal === undefined && this.get('subtotal') !== undefined) this.subtotal = Number(this.get('subtotal'));
  if (this.taxableAmount === undefined && this.get('taxable_amount') !== undefined) this.taxableAmount = Number(this.get('taxable_amount'));
  if (this.grandTotal === undefined && this.get('grand_total') !== undefined) this.grandTotal = Number(this.get('grand_total'));
  if (this.paymentMethod === undefined && this.get('payment_method') !== undefined) this.paymentMethod = this.get('payment_method');
  if (this.paymentStatus === undefined && this.get('payment_status') !== undefined) this.paymentStatus = this.get('payment_status');
  next();
});

invoiceSchema.index({ businessId: 1, invoiceId: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
