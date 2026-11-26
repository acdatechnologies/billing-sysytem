import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';

export async function getInventorySummary(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const products = await Product.find({ businessId, isActive: 1 });

    let totalProducts = products.length;
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const stock = Number(p.currentStock) || 0;
      const costPrice = Number(p.purchasePrice) || 0;
      const sellPrice = Number(p.sellingPrice) || 0;

      totalStockUnits += stock;
      totalCostValuation += stock * costPrice;
      totalRetailValuation += stock * sellPrice;

      const minStock = Number(p.minimumStock) || 0;
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= minStock) {
        lowStockCount++;
      }
    }

    res.json({
      success: true,
      data: {
        totalSkus: totalProducts,
        totalProducts,
        totalUnits: totalStockUnits,
        totalStockUnits,
        totalCostValuation,
        totalStockValue: totalCostValuation,
        totalRetailValuation,
        totalStockRetailValue: totalRetailValuation,
        lowStockCount,
        outOfStockCount,
        healthyCount: Math.max(0, totalProducts - lowStockCount - outOfStockCount),
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
      currentStock: newStock,
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
