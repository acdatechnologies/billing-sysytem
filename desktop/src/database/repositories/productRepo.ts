import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface ProductInput {
  name: string;
  code: string;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  unit?: string;
  purchase_price: number;
  selling_price: number;
  opening_stock?: number;
  current_stock?: number;
  minimum_stock?: number;
  gst_rate?: number;
  hsn_code?: string;
  is_active?: number;
}

export interface ProductFilter {
  search?: string;
  categoryId?: string;
  stockStatus?: 'ALL' | 'LOW' | 'OUT' | 'HEALTHY';
  isActiveOnly?: boolean;
}

export function listProducts(db: Database.Database, filter: ProductFilter = {}) {
  let query = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter.isActiveOnly !== false) {
    query += ` AND p.is_active = 1`;
  }

  if (filter.categoryId) {
    query += ` AND p.category_id = ?`;
    params.push(filter.categoryId);
  }

  if (filter.search && filter.search.trim() !== '') {
    const s = `%${filter.search.trim()}%`;
    query += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR p.hsn_code LIKE ?)`;
    params.push(s, s, s, s);
  }

  if (filter.stockStatus === 'LOW') {
    query += ` AND p.current_stock > 0 AND p.current_stock <= p.minimum_stock`;
  } else if (filter.stockStatus === 'OUT') {
    query += ` AND p.current_stock <= 0`;
  } else if (filter.stockStatus === 'HEALTHY') {
    query += ` AND p.current_stock > p.minimum_stock`;
  }

  query += ` ORDER BY p.name ASC`;

  return db.prepare(query).all(...params);
}

export function getProductById(db: Database.Database, id: string) {
  return db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id);
}

export function createProduct(db: Database.Database, input: ProductInput, businessId = 'biz_default_001') {
  // Validate unique code
  const existingCode = db.prepare('SELECT id FROM products WHERE code = ? AND business_id = ?').get(input.code, businessId);
  if (existingCode) {
    throw new Error(`Product Code "${input.code}" already exists.`);
  }

  const id = `prod_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();
  const openingStock = Number(input.opening_stock) || 0;
  const currentStock = openingStock;

  const transaction = db.transaction(() => {
    // If category_id provided, get category name
    let catName = input.category_name || '';
    if (input.category_id && !catName) {
      const cat = db.prepare('SELECT name FROM product_categories WHERE id = ?').get(input.category_id) as any;
      if (cat) catName = cat.name;
    }

    const insertStmt = db.prepare(`
      INSERT INTO products (
        id, business_id, name, code, barcode, category_id, category_name, unit,
        purchase_price, selling_price, opening_stock, current_stock, minimum_stock,
        gst_rate, hsn_code, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id,
      businessId,
      input.name.trim(),
      input.code.trim().toUpperCase(),
      input.barcode ? input.barcode.trim() : null,
      input.category_id || null,
      catName,
      input.unit || 'PCS',
      Number(input.purchase_price) || 0,
      Number(input.selling_price) || 0,
      openingStock,
      currentStock,
      input.minimum_stock !== undefined ? Number(input.minimum_stock) : 5,
      input.gst_rate !== undefined ? Number(input.gst_rate) : 18.0,
      input.hsn_code ? input.hsn_code.trim() : null,
      input.is_active !== undefined ? input.is_active : 1,
      now,
      now
    );

    // If opening stock > 0, record initial stock movement
    if (openingStock > 0) {
      const movementId = `sm_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      db.prepare(`
        INSERT INTO stock_movements (
          id, business_id, product_id, movement_type, quantity, previous_stock, current_stock,
          reference_id, reference_type, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movementId,
        businessId,
        id,
        'OPENING_STOCK',
        openingStock,
        0,
        openingStock,
        id,
        'PRODUCT_CREATION',
        'Initial opening stock',
        now
      );
    }

    // Queue in sync_queue for offline-to-cloud sync
    const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)
    `).run(
      syncId,
      'PRODUCT',
      id,
      'CREATE',
      JSON.stringify({ ...input, id, current_stock: currentStock }),
      now
    );
  });

  transaction();
  return getProductById(db, id);
}

export function updateProduct(db: Database.Database, id: string, input: Partial<ProductInput>, businessId = 'biz_default_001') {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  if (!existing) {
    throw new Error('Product not found.');
  }

  // Check code uniqueness if code changed
  if (input.code && input.code.trim().toUpperCase() !== existing.code) {
    const codeConflict = db.prepare('SELECT id FROM products WHERE code = ? AND id != ? AND business_id = ?').get(
      input.code.trim().toUpperCase(),
      id,
      businessId
    );
    if (codeConflict) {
      throw new Error(`Product Code "${input.code}" already exists.`);
    }
  }

  const now = new Date().toISOString();

  let catName = input.category_name;
  if (input.category_id && input.category_id !== existing.category_id) {
    const cat = db.prepare('SELECT name FROM product_categories WHERE id = ?').get(input.category_id) as any;
    catName = cat ? cat.name : '';
  }

  const stmt = db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      code = COALESCE(?, code),
      barcode = COALESCE(?, barcode),
      category_id = COALESCE(?, category_id),
      category_name = COALESCE(?, category_name),
      unit = COALESCE(?, unit),
      purchase_price = COALESCE(?, purchase_price),
      selling_price = COALESCE(?, selling_price),
      minimum_stock = COALESCE(?, minimum_stock),
      gst_rate = COALESCE(?, gst_rate),
      hsn_code = COALESCE(?, hsn_code),
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    input.name ? input.name.trim() : null,
    input.code ? input.code.trim().toUpperCase() : null,
    input.barcode !== undefined ? input.barcode : null,
    input.category_id !== undefined ? input.category_id : null,
    catName !== undefined ? catName : null,
    input.unit !== undefined ? input.unit : null,
    input.purchase_price !== undefined ? Number(input.purchase_price) : null,
    input.selling_price !== undefined ? Number(input.selling_price) : null,
    input.minimum_stock !== undefined ? Number(input.minimum_stock) : null,
    input.gst_rate !== undefined ? Number(input.gst_rate) : null,
    input.hsn_code !== undefined ? input.hsn_code : null,
    input.is_active !== undefined ? input.is_active : null,
    now,
    id
  );

  // Queue in sync_queue
  const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  db.prepare(`
    INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
    VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)
  `).run(
    syncId,
    'PRODUCT',
    id,
    'UPDATE',
    JSON.stringify(input),
    now
  );

  return getProductById(db, id);
}

export function deleteProduct(db: Database.Database, id: string) {
  // Check if product is referenced in invoice_items
  const hasInvoices = db.prepare('SELECT id FROM invoice_items WHERE product_id = ? LIMIT 1').get(id);

  if (hasInvoices) {
    // Soft delete to protect financial audit integrity
    db.prepare('UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      id
    );
    return { success: true, softDeleted: true, message: 'Product is linked to previous invoices. It has been deactivated to preserve transaction history.' };
  }

  // Safe hard delete
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)
    `).run(
      syncId,
      'PRODUCT',
      id,
      'DELETE',
      JSON.stringify({ id }),
      new Date().toISOString()
    );
  });

  transaction();
  return { success: true, softDeleted: false, message: 'Product permanently removed.' };
}

// Categories
export function listCategories(db: Database.Database, businessId = 'biz_default_001') {
  return db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM product_categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
    WHERE c.business_id = ?
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all(businessId);
}

export function createCategory(db: Database.Database, name: string, description = '', businessId = 'biz_default_001') {
  const existing = db.prepare('SELECT id FROM product_categories WHERE LOWER(name) = LOWER(?) AND business_id = ?').get(name.trim(), businessId);
  if (existing) {
    throw new Error(`Category "${name}" already exists.`);
  }

  const id = `cat_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO product_categories (id, business_id, name, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, businessId, name.trim(), description.trim(), now);

  return { id, name: name.trim(), description: description.trim(), created_at: now, product_count: 0 };
}
