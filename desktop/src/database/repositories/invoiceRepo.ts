import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export interface CreateInvoiceItemInput {
  productId: string;
  productName: string;
  productCode: string;
  hsnCode?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
}

export interface CreateInvoiceInput {
  invoiceDate: string; // YYYY-MM-DD
  invoiceTime: string; // HH:MM:SS
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  customerGstin?: string;
  isInterstate: boolean;
  items: CreateInvoiceItemInput[];
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  roundOff: number;
  amountReceived: number;
  balanceDue: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
}

export interface InvoiceFilter {
  search?: string;
  status?: 'ACTIVE' | 'CANCELLED' | 'ALL';
  paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID' | 'ALL';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function getNextInvoiceNumber(db: Database.Database, businessId = 'biz_default_001'): string {
  const invoices = db.prepare('SELECT invoice_number FROM invoices WHERE business_id = ?').all(businessId) as any[];

  let maxSeq = 0;
  for (const inv of invoices) {
    if (!inv.invoice_number) continue;
    const match = inv.invoice_number.trim().match(/INV-(?:.*-)?0*(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  }

  const nextSeq = maxSeq + 1;
  return `INV-${String(nextSeq).padStart(2, '0')}`;
}

export function createInvoice(
  db: Database.Database,
  input: CreateInvoiceInput,
  businessId = 'biz_default_001'
) {
  if (!input.items || input.items.length === 0) {
    throw new Error('An invoice must contain at least one item.');
  }

  const invoiceId = `inv_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    // 1. Reserve invoice number
    let invoiceNumber = input.invoiceNumber;
    if (!invoiceNumber) {
      const invoices = db.prepare('SELECT invoice_number FROM invoices WHERE business_id = ?').all(businessId) as any[];
      let maxSeq = 0;
      for (const inv of invoices) {
        if (!inv.invoice_number) continue;
        const match = inv.invoice_number.trim().match(/INV-(?:.*-)?0*(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
      invoiceNumber = `INV-${String(maxSeq + 1).padStart(2, '0')}`;
    }

    // 2. Manage or update customer
    let custId = input.customerId;
    const custMobile = input.customerMobile ? input.customerMobile.trim() : '';
    const custName = input.customerName ? input.customerName.trim() : 'Walk-in Customer';

    if (custId) {
      // Existing customer, update stats
      db.prepare(`
        UPDATE customers
        SET total_purchases = total_purchases + ?,
            total_bills = total_bills + 1,
            last_purchase_date = ?,
            updated_at = ?
        WHERE id = ?
      `).run(input.grandTotal, input.invoiceDate, now, custId);
    } else if (custMobile && custMobile.length >= 10) {
      // Find by mobile or create new customer
      const existingCust = db.prepare('SELECT id FROM customers WHERE mobile = ? AND business_id = ?').get(custMobile, businessId) as any;
      if (existingCust) {
        custId = existingCust.id;
        db.prepare(`
          UPDATE customers
          SET total_purchases = total_purchases + ?,
              total_bills = total_bills + 1,
              last_purchase_date = ?,
              updated_at = ?
          WHERE id = ?
        `).run(input.grandTotal, input.invoiceDate, now, custId);
      } else {
        custId = `cust_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
        db.prepare(`
          INSERT INTO customers (
            id, business_id, name, mobile, gstin, total_purchases, total_bills,
            last_purchase_date, whatsapp_consent, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?)
        `).run(custId, businessId, custName, custMobile, input.customerGstin || null, input.grandTotal, input.invoiceDate, now, now);
      }
    }

    // 3. Insert Invoice Record
    db.prepare(`
      INSERT INTO invoices (
        id, business_id, invoice_number, invoice_date, invoice_time,
        customer_id, customer_name, customer_mobile, customer_gstin,
        is_interstate, subtotal, item_discount_total, invoice_discount_total,
        taxable_amount, cgst_total, sgst_total, igst_total, grand_total,
        round_off, amount_received, balance_due, payment_method, payment_status,
        status, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        'ACTIVE', ?, ?, ?
      )
    `).run(
      invoiceId,
      businessId,
      invoiceNumber,
      input.invoiceDate,
      input.invoiceTime,
      custId || null,
      custName,
      custMobile || null,
      input.customerGstin || null,
      input.isInterstate ? 1 : 0,
      input.subtotal,
      input.itemDiscountTotal,
      input.invoiceDiscountTotal,
      input.taxableAmount,
      input.cgstTotal,
      input.sgstTotal,
      input.igstTotal,
      input.grandTotal,
      input.roundOff,
      input.amountReceived,
      input.balanceDue,
      input.paymentMethod,
      input.paymentStatus,
      input.notes || null,
      now,
      now
    );

    // 4. Insert Invoice Line Items and Deduct Stock
    const insertItemStmt = db.prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, product_id, product_name, product_code, hsn_code, unit,
        quantity, unit_price, discount_percent, discount_amount, taxable_value,
        gst_rate, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount,
        total_amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStockStmt = db.prepare(`
      UPDATE products
      SET current_stock = current_stock - ?, updated_at = ?
      WHERE id = ?
    `);

    const insertMovementStmt = db.prepare(`
      INSERT INTO stock_movements (
        id, business_id, product_id, movement_type, quantity, previous_stock, current_stock,
        reference_id, reference_type, notes, created_at
      ) VALUES (?, ?, ?, 'SALE', ?, ?, ?, ?, 'INVOICE', ?, ?)
    `);

    for (const item of input.items) {
      const itemId = `item_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      insertItemStmt.run(
        itemId,
        invoiceId,
        item.productId,
        item.productName,
        item.productCode,
        item.hsnCode || null,
        item.unit || 'PCS',
        item.quantity,
        item.unitPrice,
        item.discountPercent || 0,
        item.discountAmount || 0,
        item.taxableValue,
        item.gstRate,
        item.cgstRate || 0,
        item.cgstAmount || 0,
        item.sgstRate || 0,
        item.sgstAmount || 0,
        item.igstRate || 0,
        item.igstAmount || 0,
        item.totalAmount,
        now
      );

      // Fetch current stock before deduction for movement audit log
      const pRow = db.prepare('SELECT current_stock FROM products WHERE id = ?').get(item.productId) as any;
      const prevStock = pRow ? Number(pRow.current_stock) : 0;
      const newStock = prevStock - Number(item.quantity);

      updateStockStmt.run(item.quantity, now, item.productId);

      const movementId = `sm_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      insertMovementStmt.run(
        movementId,
        businessId,
        item.productId,
        -item.quantity,
        prevStock,
        newStock,
        invoiceId,
        `Invoice #${invoiceNumber} sale`,
        now
      );
    }

    // 5. Record initial payment if received > 0
    if (input.amountReceived > 0) {
      const paymentId = `pay_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      db.prepare(`
        INSERT INTO payments (
          id, invoice_id, business_id, amount, payment_method, transaction_reference, notes, payment_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId,
        invoiceId,
        businessId,
        input.amountReceived,
        input.paymentMethod,
        invoiceNumber,
        'Initial billing payment',
        input.invoiceDate,
        now
      );
    }

    // 6. Queue in sync_queue for cloud synchronization
    const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
      VALUES (?, 'INVOICE', ?, 'CREATE', ?, 'PENDING', 0, ?)
    `).run(
      syncId,
      invoiceId,
      JSON.stringify({ ...input, id: invoiceId, invoiceNumber }),
      now
    );

    return { invoiceId, invoiceNumber };
  });

  const result = transaction();
  return getInvoiceById(db, result.invoiceId);
}

export function cancelInvoice(
  db: Database.Database,
  invoiceId: string,
  cancellationReason: string,
  businessId = 'biz_default_001'
) {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND business_id = ?').get(invoiceId, businessId) as any;
  if (!invoice) {
    throw new Error('Invoice not found.');
  }
  if (invoice.status === 'CANCELLED') {
    throw new Error('This invoice is already cancelled.');
  }

  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    // 1. Mark invoice cancelled
    db.prepare(`
      UPDATE invoices
      SET status = 'CANCELLED',
          cancellation_reason = ?,
          cancelled_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(cancellationReason || 'Invoice cancelled by user', now, now, invoiceId);

    // 2. Fetch invoice items to reverse stock
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId) as any[];

    const restoreStockStmt = db.prepare(`
      UPDATE products
      SET current_stock = current_stock + ?, updated_at = ?
      WHERE id = ?
    `);

    const insertMovementStmt = db.prepare(`
      INSERT INTO stock_movements (
        id, business_id, product_id, movement_type, quantity, previous_stock, current_stock,
        reference_id, reference_type, notes, created_at
      ) VALUES (?, ?, ?, 'CANCELLATION', ?, ?, ?, ?, 'INVOICE_CANCEL', ?, ?)
    `);

    for (const item of items) {
      const pRow = db.prepare('SELECT current_stock FROM products WHERE id = ?').get(item.product_id) as any;
      const prevStock = pRow ? Number(pRow.current_stock) : 0;
      const newStock = prevStock + Number(item.quantity);

      restoreStockStmt.run(item.quantity, now, item.product_id);

      const movementId = `sm_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      insertMovementStmt.run(
        movementId,
        businessId,
        item.product_id,
        item.quantity,
        prevStock,
        newStock,
        invoiceId,
        `Reversal for cancelled invoice #${invoice.invoice_number}`,
        now
      );
    }

    // 3. If customer linked, deduct customer total purchases and total bills
    if (invoice.customer_id) {
      db.prepare(`
        UPDATE customers
        SET total_purchases = MAX(0, total_purchases - ?),
            total_bills = MAX(0, total_bills - 1),
            updated_at = ?
        WHERE id = ?
      `).run(invoice.grand_total, now, invoice.customer_id);
    }

    // 4. Queue in sync_queue
    const syncId = `sync_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, status, retry_count, created_at)
      VALUES (?, 'INVOICE', ?, 'CANCEL', ?, 'PENDING', 0, ?)
    `).run(
      syncId,
      invoiceId,
      JSON.stringify({ invoiceId, cancellationReason, cancelledAt: now }),
      now
    );
  });

  transaction();
  return getInvoiceById(db, invoiceId);
}

export function listInvoices(db: Database.Database, filter: InvoiceFilter = {}, businessId = 'biz_default_001') {
  let query = `
    SELECT *
    FROM invoices
    WHERE business_id = ?
  `;
  const params: any[] = [businessId];

  if (filter.status && filter.status !== 'ALL') {
    query += ` AND status = ?`;
    params.push(filter.status);
  }

  if (filter.paymentStatus && filter.paymentStatus !== 'ALL') {
    query += ` AND payment_status = ?`;
    params.push(filter.paymentStatus);
  }

  if (filter.startDate) {
    query += ` AND date(invoice_date) >= date(?)`;
    params.push(filter.startDate);
  }

  if (filter.endDate) {
    query += ` AND date(invoice_date) <= date(?)`;
    params.push(filter.endDate);
  }

  if (filter.search && filter.search.trim() !== '') {
    const s = `%${filter.search.trim()}%`;
    query += ` AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_mobile LIKE ?)`;
    params.push(s, s, s);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(filter.limit || 100);

  return db.prepare(query).all(...params);
}

export function getInvoiceById(db: Database.Database, invoiceId: string) {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
  if (!invoice) return null;

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC').all(invoiceId);
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at ASC').all(invoiceId);
  const business = db.prepare(`
    SELECT b.*, s.invoice_prefix, s.invoice_footer, s.terms_and_conditions, s.paper_size
    FROM businesses b
    LEFT JOIN business_settings s ON b.id = s.business_id
    WHERE b.id = ?
  `).get(invoice.business_id);

  return {
    ...invoice,
    items,
    payments,
    business,
  };
}
