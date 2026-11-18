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

invoiceSchema.index({ businessId: 1, invoiceId: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 });
invoiceSchema.index({ businessId: 1, invoiceDate: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
