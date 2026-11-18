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

customerSchema.index({ businessId: 1, customerId: 1 }, { unique: true });
customerSchema.index({ businessId: 1, mobile: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
