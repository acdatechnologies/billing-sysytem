import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    gstin: { type: String },
    totalPurchases: { type: Number, default: 0 },
    totalBills: { type: Number, default: 0 },
    lastPurchaseDate: { type: String },
    whatsappConsent: { type: Number, default: 1 },
    updatedAtLocal: { type: String, required: true },
  },
  { timestamps: true }
);

// Pre-validate hook for snake_case mapping
customerSchema.pre('validate', function (next) {
  if (this.whatsappConsent === undefined && this.get('whatsapp_consent') !== undefined) {
    this.whatsappConsent = Number(this.get('whatsapp_consent'));
  }
  if (this.totalPurchases === undefined && this.get('total_purchases') !== undefined) {
    this.totalPurchases = Number(this.get('total_purchases'));
  }
  if (this.totalBills === undefined && this.get('total_bills') !== undefined) {
    this.totalBills = Number(this.get('total_bills'));
  }
  if (!this.lastPurchaseDate && this.get('last_purchase_date')) {
    this.lastPurchaseDate = this.get('last_purchase_date');
  }
  if (!this.customerId && this.get('id')) {
    this.customerId = this.get('id');
  }
  next();
});

customerSchema.index({ businessId: 1, customerId: 1 }, { unique: true });
customerSchema.index({ businessId: 1, mobile: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
