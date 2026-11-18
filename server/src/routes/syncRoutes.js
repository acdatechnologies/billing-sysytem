import express from 'express';
import { authenticateBusiness } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { StockMovement } from '../models/StockMovement.js';
import { Business } from '../models/Business.js';

export const syncRouter = express.Router();

// Apply auth middleware to all sync endpoints
syncRouter.use(authenticateBusiness);

// Push local offline mutations to MongoDB Atlas
syncRouter.post('/push', async (req, res) => {
  try {
    const businessId = req.businessId;
    const { batch } = req.body; // Array of { queueId, entityType, entityId, action, payload }

    if (!Array.isArray(batch) || batch.length === 0) {
      return res.json({ syncedQueueIds: [], message: 'No mutations to process.' });
    }

    const syncedQueueIds = [];

    for (const item of batch) {
      const { queueId, entityType, entityId, action, payload } = item;
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

      try {
        if (entityType === 'PRODUCT') {
          if (action === 'DELETE') {
            await Product.deleteOne({ businessId, productId: entityId });
          } else {
            // Idempotent upsert
            await Product.findOneAndUpdate(
              { businessId, productId: entityId },
              {
                businessId,
                productId: entityId,
                name: data.name,
                code: data.code,
                barcode: data.barcode,
                categoryId: data.category_id,
                categoryName: data.category_name,
                unit: data.unit,
                purchasePrice: data.purchase_price,
                sellingPrice: data.selling_price,
                currentStock: data.current_stock,
                minimumStock: data.minimum_stock,
                gstRate: data.gst_rate,
                hsnCode: data.hsn_code,
                isActive: data.is_active !== undefined ? data.is_active : 1,
                updatedAtLocal: data.updated_at || new Date().toISOString(),
              },
              { upsert: true, new: true }
            );
          }
          syncedQueueIds.push(queueId);
        } else if (entityType === 'CUSTOMER') {
          if (action === 'DELETE') {
            await Customer.deleteOne({ businessId, customerId: entityId });
          } else {
            await Customer.findOneAndUpdate(
              { businessId, customerId: entityId },
              {
                businessId,
                customerId: entityId,
                name: data.name,
                mobile: data.mobile,
                email: data.email,
                address: data.address,
                gstin: data.gstin,
                totalPurchases: data.total_purchases || 0,
                totalBills: data.total_bills || 0,
                lastPurchaseDate: data.last_purchase_date,
                whatsappConsent: data.whatsapp_consent !== undefined ? data.whatsapp_consent : 1,
                updatedAtLocal: data.updated_at || new Date().toISOString(),
              },
              { upsert: true, new: true }
            );
          }
          syncedQueueIds.push(queueId);
        } else if (entityType === 'INVOICE') {
          if (action === 'CANCEL') {
            await Invoice.findOneAndUpdate(
              { businessId, invoiceId: entityId },
              {
                status: 'CANCELLED',
                cancellationReason: data.cancellationReason,
                cancelledAt: data.cancelledAt,
                updatedAtLocal: data.cancelledAt || new Date().toISOString(),
              }
            );
          } else {
            // Upsert invoice - preventing duplicates
            await Invoice.findOneAndUpdate(
              { businessId, invoiceId: entityId },
              {
                businessId,
                invoiceId: entityId,
                invoiceNumber: data.invoiceNumber,
                invoiceDate: data.invoiceDate,
                invoiceTime: data.invoiceTime,
                customerId: data.customerId,
                customerName: data.customerName,
                customerMobile: data.customerMobile,
                customerGstin: data.customerGstin,
                isInterstate: Boolean(data.isInterstate),
                items: data.items,
                subtotal: data.subtotal,
                itemDiscountTotal: data.itemDiscountTotal,
                invoiceDiscountTotal: data.invoiceDiscountTotal,
                taxableAmount: data.taxableAmount,
                cgstTotal: data.cgstTotal,
                sgstTotal: data.sgstTotal,
                igstTotal: data.igstTotal,
                grandTotal: data.grandTotal,
                roundOff: data.roundOff,
                amountReceived: data.amountReceived,
                balanceDue: data.balanceDue,
                paymentMethod: data.paymentMethod,
                paymentStatus: data.paymentStatus,
                status: data.status || 'ACTIVE',
                notes: data.notes,
                updatedAtLocal: new Date().toISOString(),
              },
              { upsert: true, new: true }
            );
          }
          syncedQueueIds.push(queueId);
        } else if (entityType === 'STOCK_MOVEMENT') {
          await StockMovement.findOneAndUpdate(
            { businessId, movementId: entityId },
            {
              businessId,
              movementId: entityId,
              productId: data.productId,
              movementType: data.movementType,
              quantity: data.quantity,
              previousStock: data.previousStock,
              currentStock: data.currentStock,
              referenceId: data.referenceId,
              notes: data.notes,
              createdAtLocal: new Date().toISOString(),
            },
            { upsert: true, new: true }
          );
          syncedQueueIds.push(queueId);
        }
      } catch (mutationErr) {
        console.error(`[Sync] Failed mutation for item ${queueId}:`, mutationErr);
      }
    }

    // Update business last sync time
    await Business.findOneAndUpdate({ businessId }, { lastSyncAt: new Date() });

    res.json({
      success: true,
      syncedQueueIds,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Sync] Push error:', err);
    res.status(500).json({ error: 'Server error during sync push.' });
  }
});

// Pull remote updates
syncRouter.get('/pull', async (req, res) => {
  try {
    const businessId = req.businessId;
    const since = req.query.since ? new Date(req.query.since) : new Date(0);

    const [updatedProducts, updatedCustomers, updatedInvoices] = await Promise.all([
      Product.find({ businessId, updatedAt: { $gt: since } }),
      Customer.find({ businessId, updatedAt: { $gt: since } }),
      Invoice.find({ businessId, updatedAt: { $gt: since } }),
    ]);

    res.json({
      products: updatedProducts,
      customers: updatedCustomers,
      invoices: updatedInvoices,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Sync] Pull error:', err);
    res.status(500).json({ error: 'Server error during sync pull.' });
  }
});

// Full Cloud Backup Export
syncRouter.post('/backup', async (req, res) => {
  try {
    const businessId = req.businessId;
    const [products, customers, invoices, movements, biz] = await Promise.all([
      Product.find({ businessId }),
      Customer.find({ businessId }),
      Invoice.find({ businessId }),
      StockMovement.find({ businessId }),
      Business.findOne({ businessId }).select('-passwordHash'),
    ]);

    const backupSnapshot = {
      business: biz,
      timestamp: new Date().toISOString(),
      counts: {
        products: products.length,
        customers: customers.length,
        invoices: invoices.length,
        stockMovements: movements.length,
      },
      data: {
        products,
        customers,
        invoices,
        stockMovements: movements,
      },
    };

    res.json({
      success: true,
      message: 'Cloud backup snapshot generated successfully.',
      backup: backupSnapshot,
    });
  } catch (err) {
    console.error('[Sync] Backup error:', err);
    res.status(500).json({ error: 'Server error during backup creation.' });
  }
});
