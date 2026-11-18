import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    categoryId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    productCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

categorySchema.index({ businessId: 1, categoryId: 1 }, { unique: true });
categorySchema.index({ businessId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
