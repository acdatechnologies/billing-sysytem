import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    movementId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    movementType: { type: String, required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    currentStock: { type: Number, required: true },
    referenceId: { type: String },
    notes: { type: String },
    createdAtLocal: { type: String, required: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ businessId: 1, movementId: 1 }, { unique: true });
stockMovementSchema.index({ businessId: 1, productId: 1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
