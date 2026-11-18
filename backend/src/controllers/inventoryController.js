import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';

export async function getInventorySummary(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const products = await Product.find({ businessId, isActive: 1 });

    let totalProducts = products.length;
    let totalStockUnits = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalStockUnits += p.currentStock || 0;
      totalStockValue += (p.currentStock || 0) * (p.purchasePrice || p.sellingPrice || 0);

      if (p.currentStock <= 0) {
        outOfStockCount++;
      } else if (p.currentStock <= p.minimumStock) {
        lowStockCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalProducts,
        totalStockUnits,
        totalStockValue,
        lowStockCount,
        outOfStockCount,
        healthyCount: totalProducts - lowStockCount - outOfStockCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStockMovements(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const { productId, limit = 50 } = req.query;

    const query = { businessId };
    if (productId) query.productId = productId;

    const movements = await StockMovement.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: movements.length, data: movements });
  } catch (err) {
    next(err);
  }
}

export async function adjustStock(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const { productId, movementType, quantity, reason, notes } = req.body;

    if (!productId || !movementType || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'Product ID, movement type, and quantity are required.' });
    }

    const product = await Product.findOne({ productId, businessId });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    if (movementType === 'IN' || movementType === 'RETURN') {
      newStock = previousStock + Number(quantity);
    } else if (movementType === 'OUT' || movementType === 'DAMAGE' || movementType === 'SALE') {
      newStock = Math.max(0, previousStock - Number(quantity));
    } else if (movementType === 'AUDIT_CORRECTION') {
      newStock = Number(quantity);
    }

    product.currentStock = newStock;
    product.updatedAtLocal = new Date().toISOString();
    await product.save();

    const movement = new StockMovement({
      movementId: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      businessId,
      productId,
      productName: product.name,
      movementType,
      quantity: Number(quantity),
      previousStock,
      newStock,
      referenceType: reason || 'MANUAL_ADJUSTMENT',
      referenceId: '',
      notes: notes || '',
      createdAtLocal: new Date().toISOString(),
    });

    await movement.save();

    res.json({
      success: true,
      message: 'Stock adjusted successfully.',
      data: {
        product,
        movement,
      },
    });
  } catch (err) {
    next(err);
  }
}
