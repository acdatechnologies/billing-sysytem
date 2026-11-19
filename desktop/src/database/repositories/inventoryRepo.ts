import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface StockAdjustmentInput {
  productId: string;
  movementType: 'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'RETURN';
  quantity: number; // positive number of units changed (or new total count for CORRECTION)
  notes?: string;
}

export function adjustStock(
  db: Database.Database,
  input: StockAdjustmentInput,
  businessId = 'biz_default_001'
) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(input.productId) as any;
  if (!product) {
    throw new Error('Product not found.');
  }

  const previousStock = Number(product.current_stock) || 0;
  let deltaQuantity = Number(input.quantity);
  let newStock = previousStock;

  if (input.movementType === 'RESTOCK' || input.movementType === 'RETURN') {
    if (deltaQuantity <= 0) throw new Error('Quantity must be greater than 0.');
    newStock = previousStock + deltaQuantity;
  } else if (input.movementType === 'DAMAGE') {
    if (deltaQuantity <= 0) throw new Error('Quantity must be greater than 0.');
    if (deltaQuantity > previousStock) {
      throw new Error(`Cannot deduct ${deltaQuantity} units. Only ${previousStock} units available.`);
    }
    newStock = previousStock - deltaQuantity;
  } else if (input.movementType === 'CORRECTION') {
    // In CORRECTION, input.quantity represents the actual verified physical stock
    if (deltaQuantity < 0) throw new Error('Stock count cannot be negative.');
    newStock = deltaQuantity;
    deltaQuantity = newStock - previousStock;
  }

  const now = new Date().toISOString();
  const movementId = `sm_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

  const transaction = db.transaction(() => {
    // 1. Update product stock
    db.prepare(`
      UPDATE products
      SET current_stock = ?, updated_at = ?
      WHERE id = ?
    `).run(newStock, now, input.productId);

    // 2. Insert stock movement log
    db.prepare(`
      INSERT INTO stock_movements (
        id, business_id, product_id, movement_type, quantity, previous_stock, current_stock,
        reference_id, reference_type, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movementId,
      businessId,
      input.productId,
      input.movementType,
      deltaQuantity,
      previousStock,
      newStock,
      movementId,
      'MANUAL_ADJUSTMENT',
      input.notes || `${input.movementType} adjustment recorded`,
      now
    );

    // 3. Queue in sync_queue
    const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)
    `).run(
      syncId,
      'STOCK_MOVEMENT',
      movementId,
      'CREATE',
      JSON.stringify({
        productId: input.productId,
        movementType: input.movementType,
        quantity: deltaQuantity,
        previousStock,
        newStock,
        notes: input.notes,
      }),
      now
    );
  });

  transaction();

  return {
    productId: input.productId,
    previousStock,
    currentStock: newStock,
    delta: deltaQuantity,
    movementType: input.movementType,
    updatedAt: now,
  };
}

export function getStockMovements(db: Database.Database, productId?: string, limit = 50) {
  let query = `
    SELECT sm.*, p.name as product_name, p.code as product_code, p.unit
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (productId) {
    query += ` AND sm.product_id = ?`;
    params.push(productId);
  }

  query += ` ORDER BY sm.created_at DESC LIMIT ?`;
  params.push(limit);

  return db.prepare(query).all(...params);
}

export function getInventorySummary(db: Database.Database) {
  const stats = db.prepare(`
    SELECT
      COUNT(id) as totalSkus,
      COALESCE(SUM(COALESCE(current_stock, 0)), 0) as totalUnits,
      COALESCE(SUM(COALESCE(purchase_price, 0) * COALESCE(current_stock, 0)), 0) as totalCostValuation,
      COALESCE(SUM(COALESCE(selling_price, 0) * COALESCE(current_stock, 0)), 0) as totalRetailValuation,
      COALESCE(SUM(CASE WHEN COALESCE(current_stock, 0) <= COALESCE(minimum_stock, 0) AND COALESCE(current_stock, 0) > 0 THEN 1 ELSE 0 END), 0) as lowStockCount,
      COALESCE(SUM(CASE WHEN COALESCE(current_stock, 0) <= 0 THEN 1 ELSE 0 END), 0) as outOfStockCount
    FROM products
    WHERE is_active = 1
  `).get() as any;

  return {
    totalSkus: Number(stats?.totalSkus) || 0,
    totalUnits: Number(stats?.totalUnits) || 0,
    totalCostValuation: Number(stats?.totalCostValuation) || 0,
    totalRetailValuation: Number(stats?.totalRetailValuation) || 0,
    lowStockCount: Number(stats?.lowStockCount) || 0,
    outOfStockCount: Number(stats?.outOfStockCount) || 0,
  };
}
