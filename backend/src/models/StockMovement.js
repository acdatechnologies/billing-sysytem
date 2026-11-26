import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    movementId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    productName: { type: String },
    movementType: { type: String, required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, default: 0 },
    currentStock: {
      type: Number,
      required: true,
      default: function () {
        return this.newStock !== undefined ? this.newStock : 0;
      },
    },
    newStock: { type: Number },
    referenceType: { type: String },
    referenceId: { type: String },
    notes: { type: String },
    createdAtLocal: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Pre-validate hook to guarantee currentStock is always populated from newStock if needed
stockMovementSchema.pre('validate', function (next) {
  if (this.currentStock === undefined && this.newStock !== undefined) {
    this.currentStock = this.newStock;
  }
  if (this.newStock === undefined && this.currentStock !== undefined) {
    this.newStock = this.currentStock;
  }
  if (this.currentStock === undefined) {
    this.currentStock = 0;
  }
  next();
});

stockMovementSchema.index({ businessId: 1, movementId: 1 }, { unique: true });
stockMovementSchema.index({ businessId: 1, productId: 1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
