import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String, default: 'Tamil Nadu' },
    stateCode: { type: String, default: '33' },
    website: { type: String, default: 'vndtech.in' },
    isActive: { type: Boolean, default: true },
    lastSyncAt: { type: Date },
  },
  { timestamps: true }
);

export const Business = mongoose.model('Business', businessSchema);
