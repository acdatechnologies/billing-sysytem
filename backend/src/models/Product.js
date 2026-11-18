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

// Pre-validate hook to map snake_case to camelCase
productSchema.pre('validate', function (next) {
  if (this.sellingPrice === undefined && this.get('selling_price') !== undefined) {
    this.sellingPrice = Number(this.get('selling_price'));
  }
  if (this.purchasePrice === undefined && this.get('purchase_price') !== undefined) {
    this.purchasePrice = Number(this.get('purchase_price'));
  }
  if (this.currentStock === undefined && this.get('current_stock') !== undefined) {
    this.currentStock = Number(this.get('current_stock'));
  }
  if (this.minimumStock === undefined && this.get('minimum_stock') !== undefined) {
    this.minimumStock = Number(this.get('minimum_stock'));
  }
  if (this.gstRate === undefined && this.get('gst_rate') !== undefined) {
    this.gstRate = Number(this.get('gst_rate'));
  }
  if (!this.productId && this.get('id')) {
    this.productId = this.get('id');
  }
  next();
});

// Compound index to guarantee uniqueness per business
productSchema.index({ businessId: 1, productId: 1 }, { unique: true });
productSchema.index({ businessId: 1, code: 1 });

export const Product = mongoose.model('Product', productSchema);
