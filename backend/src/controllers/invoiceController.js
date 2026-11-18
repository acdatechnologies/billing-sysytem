import { Invoice } from '../models/Invoice.js';
import { Product } from '../models/Product.js';
import { StockMovement } from '../models/StockMovement.js';
import { Customer } from '../models/Customer.js';

export async function getNextInvoiceNumber(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const now = new Date();
    const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;

    const latestInvoice = await Invoice.findOne({
      businessId,
      invoiceNumber: { $regex: `^${prefix}` },
    }).sort({ invoiceNumber: -1 });

    let nextSeq = 1;
    if (latestInvoice && latestInvoice.invoiceNumber) {
      const parts = latestInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const nextNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
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

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

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
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    next(err);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const invoice = await Invoice.findOne({ invoiceId: id, businessId });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found.' });
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const data = req.body;
    const invoiceId = data.invoiceId || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newInvoice = new Invoice({
      ...data,
      invoiceId,
      businessId,
      updatedAtLocal: new Date().toISOString(),
    });

    await newInvoice.save();

    // Deduct stock for each line item and create stock movements
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.productId) {
          const product = await Product.findOne({ productId: item.productId, businessId });
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
    }

    // Update customer stats if customerId provided
    if (data.customerId) {
      await Customer.findOneAndUpdate(
        { customerId: data.customerId, businessId },
        {
          $inc: { totalPurchases: data.grandTotal || 0, totalBills: 1 },
          lastPurchaseDate: data.invoiceDate || new Date().toISOString().split('T')[0],
          updatedAtLocal: new Date().toISOString(),
        }
      );
    }

    res.status(201).json({ success: true, data: newInvoice });
  } catch (err) {
    next(err);
  }
}

export async function cancelInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const businessId = req.businessId || 'default';

    const invoice = await Invoice.findOne({ invoiceId: id, businessId });
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
          const product = await Product.findOne({ productId: item.productId, businessId });
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

    res.json({ success: true, message: 'Invoice cancelled successfully.', data: invoice });
  } catch (err) {
    next(err);
  }
}
