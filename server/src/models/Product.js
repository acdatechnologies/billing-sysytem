import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    barcode: { type: String },
    categoryId: { type: String },
    categoryName: { type: String },
    unit: { type: String, default: 'PCS' },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 5 },
    gstRate: { type: Number, default: 18 },
    hsnCode: { type: String },
    isActive: { type: Number, default: 1 },
    updatedAtLocal: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness per business
productSchema.index({ businessId: 1, productId: 1 }, { unique: true });
productSchema.index({ businessId: 1, code: 1 });

export const Product = mongoose.model('Product', productSchema);
