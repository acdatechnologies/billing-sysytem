import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  const isDev = !app.isPackaged;
  const basePath = isDev ? path.join(process.cwd(), 'userData') : app.getPath('userData');
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  return path.join(basePath, 'vnd_tech_billing.db');
}

export function initDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  console.log('[SQLite] Initializing database at:', dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run initial migrations
  runMigrations(db);
  seedDefaultData(db);

  dbInstance = db;
  return dbInstance;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    -- Businesses Table
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gstin TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      state TEXT,
      state_code TEXT,
      website TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Business Settings Table
    CREATE TABLE IF NOT EXISTS business_settings (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL UNIQUE,
      invoice_prefix TEXT DEFAULT 'VND-',
      invoice_counter INTEGER DEFAULT 1001,
      default_gst_rate REAL DEFAULT 18.0,
      default_payment_method TEXT DEFAULT 'CASH',
      paper_size TEXT DEFAULT 'A4',
      default_printer TEXT,
      invoice_footer TEXT DEFAULT 'Powered by VND Tech | Billing Software | Business Technology Solutions | Website: vndtech.in | Contact: 88255 08237',
      terms_and_conditions TEXT DEFAULT '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Subject to local jurisdiction.',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    -- Categories Table
    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    -- Products Table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      barcode TEXT,
      category_id TEXT,
      category_name TEXT,
      unit TEXT DEFAULT 'PCS',
      size TEXT,
      color TEXT,
      fabric TEXT,
      gender TEXT,
      brand TEXT,
      rack_location TEXT,
      purchase_price REAL DEFAULT 0,
      selling_price REAL NOT NULL,
      opening_stock REAL DEFAULT 0,
      current_stock REAL DEFAULT 0,
      minimum_stock REAL DEFAULT 5,
      gst_rate REAL DEFAULT 5.0,
      hsn_code TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_size ON products(size);
    CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);

    -- Customers Table
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      address TEXT,
      gstin TEXT,
      state TEXT,
      state_code TEXT,
      total_purchases REAL DEFAULT 0,
      total_bills INTEGER DEFAULT 0,
      last_purchase_date TEXT,
      whatsapp_consent INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);

    -- Invoices Table
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      invoice_date TEXT NOT NULL,
      invoice_time TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_mobile TEXT,
      customer_gstin TEXT,
      is_interstate INTEGER DEFAULT 0,
      subtotal REAL NOT NULL,
      item_discount_total REAL DEFAULT 0,
      invoice_discount_total REAL DEFAULT 0,
      taxable_amount REAL NOT NULL,
      cgst_total REAL DEFAULT 0,
      sgst_total REAL DEFAULT 0,
      igst_total REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      round_off REAL DEFAULT 0,
      amount_received REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      notes TEXT,
      cancellation_reason TEXT,
      cancelled_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);

    -- Invoice Items Table (Preserves historical snapshots)
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      hsn_code TEXT,
      unit TEXT DEFAULT 'PCS',
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      taxable_value REAL NOT NULL,
      gst_rate REAL NOT NULL,
      cgst_rate REAL DEFAULT 0,
      cgst_amount REAL DEFAULT 0,
      sgst_rate REAL DEFAULT 0,
      sgst_amount REAL DEFAULT 0,
      igst_rate REAL DEFAULT 0,
      igst_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

    -- Payments Table
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_reference TEXT,
      notes TEXT,
      payment_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    -- Stock Movements Table (Audit Trail)
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      previous_stock REAL NOT NULL,
      current_stock REAL NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

    -- WhatsApp Messages Log
    CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      customer_id TEXT,
      invoice_id TEXT,
      mobile TEXT NOT NULL,
      message_text TEXT NOT NULL,
      status TEXT DEFAULT 'SENT',
      sent_at TEXT NOT NULL
    );

    -- Sync Queue (Offline to Cloud sync queue)
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

    -- Application Settings Table
    CREATE TABLE IF NOT EXISTS application_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Textile Schema Migrations for existing databases
    try { db.exec('ALTER TABLE products ADD COLUMN size TEXT;'); } catch (_) {}
    try { db.exec('ALTER TABLE products ADD COLUMN color TEXT;'); } catch (_) {}
    try { db.exec('ALTER TABLE products ADD COLUMN fabric TEXT;'); } catch (_) {}
    try { db.exec('ALTER TABLE products ADD COLUMN gender TEXT;'); } catch (_) {}
    try { db.exec('ALTER TABLE products ADD COLUMN brand TEXT;'); } catch (_) {}
    try { db.exec('ALTER TABLE products ADD COLUMN rack_location TEXT;'); } catch (_) {}
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_products_size ON products(size);'); } catch (_) {}
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);'); } catch (_) {}
  `);
}

function seedDefaultData(db: Database.Database) {
  const existingBiz = db.prepare('SELECT id FROM businesses LIMIT 1').get();
  if (!existingBiz) {
    const now = new Date().toISOString();
    const defaultBizId = 'biz_default_001';

    const insertBiz = db.prepare(`
      INSERT INTO businesses (id, name, gstin, phone, email, address, state, state_code, website, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertBiz.run(
      defaultBizId,
      'VND Tech Enterprises',
      '33AAAAA0000A1Z5',
      '88255 08237',
      'contact@vndtech.in',
      'Tech Park Road, Coimbatore, Tamil Nadu, 641001',
      'Tamil Nadu',
      '33',
      'vndtech.in',
      now,
      now
    );

    const insertSettings = db.prepare(`
      INSERT INTO business_settings (
        id, business_id, invoice_prefix, invoice_counter, default_gst_rate, default_payment_method, paper_size, invoice_footer, terms_and_conditions, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSettings.run(
      'set_default_001',
      defaultBizId,
      'VND-',
      1001,
      18.0,
      'CASH',
      'A4',
      'Powered by VND Tech | Billing Software | Business Technology Solutions | Website: vndtech.in | Contact: 88255 08237',
      '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Subject to local jurisdiction.',
      now
    );

    // Seed default product categories
    const categories = [
      { id: 'cat_01', name: 'Electronics & Computers' },
      { id: 'cat_02', name: 'Peripherals & Accessories' },
      { id: 'cat_03', name: 'Software & Licenses' },
      { id: 'cat_04', name: 'General Merchandise' },
    ];
    const insertCat = db.prepare(`
      INSERT INTO product_categories (id, business_id, name, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const c of categories) {
      insertCat.run(c.id, defaultBizId, c.name, `${c.name} Category`, now);
    }

    // Seed some initial demo products to make the dashboard immediately useful
    const demoProducts = [
      { id: 'prod_01', name: 'VND Wireless Thermal Printer 80mm', code: 'PRN-80W', barcode: '8901234567890', catId: 'cat_01', catName: 'Electronics & Computers', unit: 'PCS', buy: 2800, sell: 4200, stock: 15, minStock: 3, gst: 18, hsn: '844332' },
      { id: 'prod_02', name: 'VND Desktop Barcode Scanner 2D', code: 'SCN-2D', barcode: '8901234567891', catId: 'cat_01', catName: 'Electronics & Computers', unit: 'PCS', buy: 1400, sell: 2400, stock: 22, minStock: 5, gst: 18, hsn: '847160' },
      { id: 'prod_03', name: 'Thermal Paper Roll 80mm (Pack of 10)', code: 'PPR-80MM', barcode: '8901234567892', catId: 'cat_02', catName: 'Peripherals & Accessories', unit: 'BOX', buy: 320, sell: 550, stock: 45, minStock: 10, gst: 12, hsn: '481190' },
      { id: 'prod_04', name: 'USB-C Fast Charging Cable 2M', code: 'CBL-USBC', barcode: '8901234567893', catId: 'cat_02', catName: 'Peripherals & Accessories', unit: 'PCS', buy: 120, sell: 299, stock: 2, minStock: 5, gst: 18, hsn: '854442' }, // Low stock!
      { id: 'prod_05', name: 'Wireless Ergonomic Optical Mouse', code: 'MSE-W01', barcode: '8901234567894', catId: 'cat_02', catName: 'Peripherals & Accessories', unit: 'PCS', buy: 350, sell: 699, stock: 1, minStock: 4, gst: 18, hsn: '847160' }, // Low stock!
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        id, business_id, name, code, barcode, category_id, category_name, unit, purchase_price, selling_price,
        opening_stock, current_stock, minimum_stock, gst_rate, hsn_code, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    for (const p of demoProducts) {
      insertProd.run(
        p.id, defaultBizId, p.name, p.code, p.barcode, p.catId, p.catName, p.unit, p.buy, p.sell,
        p.stock, p.stock, p.minStock, p.gst, p.hsn, now, now
      );
    }

    // Seed a couple of initial customers
    const demoCustomers = [
      { id: 'cust_01', name: 'Senthil Kumar', mobile: '9842112345', email: 'senthil@example.com', address: '12 Gandhi Street, Coimbatore', gstin: '33AAECS1234E1Z1', state: 'Tamil Nadu', stateCode: '33' },
      { id: 'cust_02', name: 'Lakshmi Narayanan', mobile: '9789012345', email: 'lakshmi@example.com', address: '45 Cross Cut Road, Coimbatore', gstin: '', state: 'Tamil Nadu', stateCode: '33' },
    ];

    const insertCust = db.prepare(`
      INSERT INTO customers (
        id, business_id, name, mobile, email, address, gstin, state, state_code, total_purchases, total_bills, last_purchase_date, whatsapp_consent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, 1, ?, ?)
    `);

    for (const c of demoCustomers) {
      insertCust.run(c.id, defaultBizId, c.name, c.mobile, c.email, c.address, c.gstin, c.state, c.stateCode, now, now);
    }

    console.log('[SQLite] Seeded default business, categories, products, and customers.');
  }
}
