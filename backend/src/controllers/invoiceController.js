import { Invoice } from '../models/Invoice.js';
import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';
import { Customer } from '../models/Customer.js';

function normalizeInvoiceItem(it) {
  return {
    productId: it.productId || it.product_id,
    productName: it.productName || it.product_name,
    productCode: it.productCode || it.product_code || '',
    hsnCode: it.hsnCode || it.hsn_code || '',
    unit: it.unit || 'PCS',
    quantity: Number(it.quantity) || 0,
    unitPrice: Number(it.unitPrice ?? it.unit_price) || 0,
    discountPercent: Number(it.discountPercent ?? it.discount_percent) || 0,
    discountAmount: Number(it.discountAmount ?? it.discount_amount) || 0,
    taxableValue: Number(it.taxableValue ?? it.taxable_value) || 0,
    gstRate: Number(it.gstRate ?? it.gst_rate) || 0,
    cgstRate: Number(it.cgstRate ?? it.cgst_rate) || 0,
    cgstAmount: Number(it.cgstAmount ?? it.cgst_amount) || 0,
    sgstRate: Number(it.sgstRate ?? it.sgst_rate) || 0,
    sgstAmount: Number(it.sgstAmount ?? it.sgst_amount) || 0,
    igstRate: Number(it.igstRate ?? it.igst_rate) || 0,
    igstAmount: Number(it.igstAmount ?? it.igst_amount) || 0,
    totalAmount: Number(it.totalAmount ?? it.total_amount) || 0,
  };
}

function formatInvoice(doc) {
  if (!doc) return null;
  const inv = doc.toObject ? doc.toObject() : doc;
  return {
    ...inv,
    id: inv.invoiceId || inv._id?.toString(),
    business_id: inv.businessId,
    invoice_number: inv.invoiceNumber,
    invoice_date: inv.invoiceDate,
    invoice_time: inv.invoiceTime,
    customer_id: inv.customerId,
    customer_name: inv.customerName,
    customer_mobile: inv.customerMobile,
    customer_gstin: inv.customerGstin,
    is_interstate: inv.isInterstate ? 1 : 0,
    subtotal: inv.subtotal,
    item_discount_total: inv.itemDiscountTotal,
    invoice_discount_total: inv.invoiceDiscountTotal,
    taxable_amount: inv.taxableAmount,
    cgst_total: inv.cgstTotal,
    sgst_total: inv.sgstTotal,
    igst_total: inv.igstTotal,
    grand_total: inv.grandTotal,
    round_off: inv.roundOff,
    amount_received: inv.amountReceived,
    balance_due: inv.balanceDue,
    payment_method: inv.paymentMethod,
    payment_status: inv.paymentStatus,
    items: Array.isArray(inv.items)
      ? inv.items.map((it) => ({
          ...it,
          product_id: it.productId,
          product_name: it.productName,
          product_code: it.productCode,
          hsn_code: it.hsnCode,
          unit_price: it.unitPrice,
          discount_percent: it.discountPercent,
          discount_amount: it.discountAmount,
          taxable_value: it.taxableValue,
          gst_rate: it.gstRate,
          cgst_rate: it.cgstRate,
          cgst_amount: it.cgstAmount,
          sgst_rate: it.sgstRate,
          sgst_amount: it.sgstAmount,
          igst_rate: it.igstRate,
          igst_amount: it.igstAmount,
          total_amount: it.totalAmount,
        }))
      : [],
  };
}

export async function getNextInvoiceNumber(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const invoices = await Invoice.find({ businessId }, { invoiceNumber: 1 });

    let maxSeq = 0;
    for (const inv of invoices) {
      if (!inv.invoiceNumber) continue;
      const match = inv.invoiceNumber.trim().match(/INV-(?:.*-)?0*(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    const nextNumber = `INV-${String(nextSeq).padStart(2, '0')}`;
    res.json({ success: true, nextNumber });
  } catch (err) {
    next(err);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const { status, paymentStatus, search, startDate, endDate } = req.query;

    const query = { businessId };

    if (status && status !== 'ALL') query.status = status;
    if (paymentStatus && paymentStatus !== 'ALL') query.paymentStatus = paymentStatus;

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerMobile: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate && endDate) {
      query.invoiceDate = { $gte: startDate, $lte: endDate };
    }

    const invoices = await Invoice.find(query).sort({ invoiceDate: -1, createdAt: -1 });
    const formatted = invoices.map(formatInvoice);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const invoice = await Invoice.findOne({
      $or: [{ invoiceId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      businessId,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found.' });
    }

    res.json({ success: true, data: formatInvoice(invoice) });
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const data = req.body;
    const invoiceId = data.invoiceId || data.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Auto-generate invoice number if missing
    let invoiceNumber = data.invoiceNumber || data.invoice_number;
    if (!invoiceNumber) {
      const invoices = await Invoice.find({ businessId }, { invoiceNumber: 1 });
      let maxSeq = 0;
      for (const inv of invoices) {
        if (!inv.invoiceNumber) continue;
        const match = inv.invoiceNumber.trim().match(/INV-(?:.*-)?0*(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
      invoiceNumber = `INV-${String(maxSeq + 1).padStart(2, '0')}`;
    }

    const normalizedItems = Array.isArray(data.items) ? data.items.map(normalizeInvoiceItem) : [];

    const newInvoice = new Invoice({
      invoiceId,
      businessId,
      invoiceNumber,
      invoiceDate: data.invoiceDate || data.invoice_date || new Date().toISOString().split('T')[0],
      invoiceTime: data.invoiceTime || data.invoice_time || new Date().toLocaleTimeString(),
      customerId: data.customerId || data.customer_id || '',
      customerName: (data.customerName || data.customer_name || 'Walk-in Customer').trim(),
      customerMobile: (data.customerMobile || data.customer_mobile || '').trim(),
      customerGstin: (data.customerGstin || data.customer_gstin || '').trim().toUpperCase(),
      isInterstate: Boolean(data.isInterstate || data.is_interstate),
      items: normalizedItems,
      subtotal: Number(data.subtotal) || 0,
      itemDiscountTotal: Number(data.itemDiscountTotal ?? data.item_discount_total) || 0,
      invoiceDiscountTotal: Number(data.invoiceDiscountTotal ?? data.invoice_discount_total) || 0,
      taxableAmount: Number(data.taxableAmount ?? data.taxable_amount) || 0,
      cgstTotal: Number(data.cgstTotal ?? data.cgst_total) || 0,
      sgstTotal: Number(data.sgstTotal ?? data.sgst_total) || 0,
      igstTotal: Number(data.igstTotal ?? data.igst_total) || 0,
      grandTotal: Number(data.grandTotal ?? data.grand_total) || 0,
      roundOff: Number(data.roundOff ?? data.round_off) || 0,
      amountReceived: Number(data.amountReceived ?? data.amount_received) || 0,
      balanceDue: Number(data.balanceDue ?? data.balance_due) || 0,
      paymentMethod: data.paymentMethod || data.payment_method || 'CASH',
      paymentStatus: data.paymentStatus || data.payment_status || 'PAID',
      status: 'ACTIVE',
      notes: data.notes || '',
      updatedAtLocal: new Date().toISOString(),
    });

    await newInvoice.save();

    // Deduct stock for each line item and create stock movements
    for (const item of normalizedItems) {
      if (item.productId) {
        const product = await Product.findOne({
          $or: [{ productId: item.productId }, { _id: item.productId.match(/^[0-9a-fA-F]{24}$/) ? item.productId : null }],
          businessId,
        });
        if (product) {
          const previousStock = product.currentStock;
          const newStock = Math.max(0, previousStock - item.quantity);
          product.currentStock = newStock;
          product.updatedAtLocal = new Date().toISOString();
          await product.save();

          const movement = new StockMovement({
            movementId: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            businessId,
            productId: item.productId,
            productName: item.productName || product.name,
            movementType: 'SALE',
            quantity: item.quantity,
            previousStock,
            newStock,
            referenceType: 'INVOICE',
            referenceId: invoiceId,
            notes: `Billed in invoice ${newInvoice.invoiceNumber}`,
            createdAtLocal: new Date().toISOString(),
          });
          await movement.save();
        }
      }
    }

    // Update customer stats if customerId provided
    const custId = newInvoice.customerId;
    if (custId) {
      await Customer.findOneAndUpdate(
        { $or: [{ customerId: custId }, { _id: custId.match(/^[0-9a-fA-F]{24}$/) ? custId : null }], businessId },
        {
          $inc: { totalPurchases: newInvoice.grandTotal, totalBills: 1 },
          lastPurchaseDate: newInvoice.invoiceDate,
          updatedAtLocal: new Date().toISOString(),
        }
      );
    }

    res.status(201).json({ success: true, data: formatInvoice(newInvoice) });
  } catch (err) {
    next(err);
  }
}

export async function cancelInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const businessId = req.businessId || 'default';

    const invoice = await Invoice.findOne({
      $or: [{ invoiceId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      businessId,
    });
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found.' });
    }

    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Invoice is already cancelled.' });
    }

    invoice.status = 'CANCELLED';
    invoice.cancellationReason = reason || 'Cancelled by user';
    invoice.cancelledAt = new Date().toISOString();
    invoice.updatedAtLocal = new Date().toISOString();
    await invoice.save();

    // Restock items
    if (Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        if (item.productId) {
          const product = await Product.findOne({
            $or: [{ productId: item.productId }, { _id: item.productId.match(/^[0-9a-fA-F]{24}$/) ? item.productId : null }],
            businessId,
          });
          if (product) {
            const previousStock = product.currentStock;
            const newStock = previousStock + item.quantity;
            product.currentStock = newStock;
            product.updatedAtLocal = new Date().toISOString();
            await product.save();

            const movement = new StockMovement({
              movementId: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              businessId,
              productId: item.productId,
              productName: item.productName || product.name,
              movementType: 'RETURN',
              quantity: item.quantity,
              previousStock,
              newStock,
              referenceType: 'INVOICE_CANCEL',
              referenceId: invoice.invoiceId,
              notes: `Restocked due to invoice cancellation: ${reason || ''}`,
              createdAtLocal: new Date().toISOString(),
            });
            await movement.save();
          }
        }
      }
    }

    res.json({ success: true, message: 'Invoice cancelled successfully.', data: formatInvoice(invoice) });
  } catch (err) {
    next(err);
  }
}
