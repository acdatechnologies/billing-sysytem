import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface CustomerInput {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  gstin?: string;
  state?: string;
  state_code?: string;
  whatsapp_consent?: number;
}

export interface CustomerFilter {
  search?: string;
  consentOnly?: boolean;
  repeatOnly?: boolean;
  recentDays?: number;
  minPurchases?: number;
}

export function listCustomers(db: Database.Database, filter: CustomerFilter = {}, businessId = 'biz_default_001') {
  let query = `
    SELECT *
    FROM customers
    WHERE business_id = ?
  `;
  const params: any[] = [businessId];

  if (filter.consentOnly) {
    query += ` AND whatsapp_consent = 1`;
  }

  if (filter.repeatOnly) {
    query += ` AND total_bills >= 2`;
  }

  if (filter.minPurchases && filter.minPurchases > 0) {
    query += ` AND total_purchases >= ?`;
    params.push(filter.minPurchases);
  }

  if (filter.recentDays && filter.recentDays > 0) {
    query += ` AND date(last_purchase_date) >= date('now', '-' || ? || ' days')`;
    params.push(filter.recentDays);
  }

  if (filter.search && filter.search.trim() !== '') {
    const s = `%${filter.search.trim()}%`;
    query += ` AND (name LIKE ? OR mobile LIKE ? OR gstin LIKE ? OR email LIKE ?)`;
    params.push(s, s, s, s);
  }

  query += ` ORDER BY updated_at DESC, name ASC`;

  return db.prepare(query).all(...params);
}

export function getCustomerById(db: Database.Database, customerId: string) {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any;
  if (!customer) return null;

  const invoices = db.prepare(`
    SELECT id, invoice_number, invoice_date, invoice_time, grand_total, payment_method, payment_status, status
    FROM invoices
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `).all(customerId);

  return {
    ...customer,
    invoices,
  };
}

export function createCustomer(db: Database.Database, input: CustomerInput, businessId = 'biz_default_001') {
  const cleanMobile = input.mobile.trim().replace(/[^0-9]/g, '');
  if (!cleanMobile || cleanMobile.length < 10) {
    throw new Error('A valid 10-digit mobile number is required.');
  }

  // Deduplication check by mobile number
  const existing = db.prepare('SELECT id, name FROM customers WHERE mobile = ? AND business_id = ?').get(cleanMobile, businessId) as any;
  if (existing) {
    throw new Error(`Customer with mobile ${cleanMobile} already exists (${existing.name}).`);
  }

  const id = `cust_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();
  const consent = input.whatsapp_consent !== undefined ? input.whatsapp_consent : 1;

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO customers (
        id, business_id, name, mobile, email, address, gstin, state, state_code,
        total_purchases, total_bills, last_purchase_date, whatsapp_consent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?, ?)
    `).run(
      id,
      businessId,
      input.name.trim(),
      cleanMobile,
      input.email ? input.email.trim() : null,
      input.address ? input.address.trim() : null,
      input.gstin ? input.gstin.trim().toUpperCase() : null,
      input.state || 'Tamil Nadu',
      input.state_code || '33',
      consent,
      now,
      now
    );

    // Record in sync_queue
    const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
      VALUES (?, 'CUSTOMER', ?, 'CREATE', ?, 'PENDING', 0, ?)
    `).run(
      syncId,
      id,
      JSON.stringify({ ...input, id, mobile: cleanMobile }),
      now
    );
  });

  transaction();
  return getCustomerById(db, id);
}

export function updateCustomer(db: Database.Database, customerId: string, input: Partial<CustomerInput>, businessId = 'biz_default_001') {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ? AND business_id = ?').get(customerId, businessId) as any;
  if (!existing) {
    throw new Error('Customer not found.');
  }

  if (input.mobile) {
    const cleanMobile = input.mobile.trim().replace(/[^0-9]/g, '');
    const conflict = db.prepare('SELECT id FROM customers WHERE mobile = ? AND id != ? AND business_id = ?').get(cleanMobile, customerId, businessId);
    if (conflict) {
      throw new Error(`Mobile number ${cleanMobile} is already in use by another customer.`);
    }
  }

  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE customers SET
      name = COALESCE(?, name),
      mobile = COALESCE(?, mobile),
      email = COALESCE(?, email),
      address = COALESCE(?, address),
      gstin = COALESCE(?, gstin),
      state = COALESCE(?, state),
      state_code = COALESCE(?, state_code),
      whatsapp_consent = COALESCE(?, whatsapp_consent),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    input.name ? input.name.trim() : null,
    input.mobile ? input.mobile.trim().replace(/[^0-9]/g, '') : null,
    input.email !== undefined ? input.email.trim() : null,
    input.address !== undefined ? input.address.trim() : null,
    input.gstin !== undefined ? input.gstin.trim().toUpperCase() : null,
    input.state !== undefined ? input.state : null,
    input.state_code !== undefined ? input.state_code : null,
    input.whatsapp_consent !== undefined ? input.whatsapp_consent : null,
    now,
    customerId
  );

  // Sync queue
  const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  db.prepare(`
    INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
    VALUES (?, 'CUSTOMER', ?, 'UPDATE', ?, 'PENDING', 0, ?)
  `).run(
    syncId,
    customerId,
    JSON.stringify(input),
    now
  );

  return getCustomerById(db, customerId);
}

export function deleteCustomer(db: Database.Database, customerId: string) {
  // Check if customer has invoices
  const hasInvoices = db.prepare('SELECT id FROM invoices WHERE customer_id = ? LIMIT 1').get(customerId);
  if (hasInvoices) {
    throw new Error('Customer has previous invoice records and cannot be permanently deleted. You can clear their contact or edit their profile instead.');
  }

  db.prepare('DELETE FROM customers WHERE id = ?').run(customerId);

  const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  db.prepare(`
    INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
    VALUES (?, 'CUSTOMER', ?, 'DELETE', ?, 'PENDING', 0, ?)
  `).run(
    syncId,
    customerId,
    JSON.stringify({ id: customerId }),
    new Date().toISOString()
  );

  return { success: true };
}

// WhatsApp Logging
export function logWhatsAppMessage(
  db: Database.Database,
  input: {
    customerId?: string;
    invoiceId?: string;
    mobile: string;
    messageText: string;
    status?: string;
  },
  businessId = 'biz_default_001'
) {
  const id = `wlog_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO whatsapp_message_logs (id, business_id, customer_id, invoice_id, mobile, message_text, status, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    businessId,
    input.customerId || null,
    input.invoiceId || null,
    input.mobile,
    input.messageText,
    input.status || 'SENT',
    now
  );

  return { id, sentAt: now };
}

export function getWhatsAppLogs(db: Database.Database, limit = 50, businessId = 'biz_default_001') {
  return db.prepare(`
    SELECT w.*, c.name as customer_name, i.invoice_number
    FROM whatsapp_message_logs w
    LEFT JOIN customers c ON w.customer_id = c.id
    LEFT JOIN invoices i ON w.invoice_id = i.id
    WHERE w.business_id = ?
    ORDER BY w.sent_at DESC
    LIMIT ?
  `).all(businessId, limit);
}
