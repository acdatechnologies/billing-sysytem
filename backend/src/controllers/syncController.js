import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { StockMovement } from '../models/StockMovement.js';

export async function pushSync(req, res, next) {
  try {
    const businessId = req.businessId;
    const { batch } = req.body;

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
                size: data.size,
                color: data.color,
                fabric: data.fabric,
                gender: data.gender,
                brand: data.brand,
                rackLocation: data.rack_location || data.rackLocation,
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
                cancellationReason: data.cancellation_reason,
                cancelledAt: data.cancelled_at,
                updatedAtLocal: data.updated_at || new Date().toISOString(),
              }
            );
          } else {
            await Invoice.findOneAndUpdate(
              { businessId, invoiceId: entityId },
              {
                businessId,
                invoiceId: entityId,
                invoiceNumber: data.invoice_number,
                invoiceDate: data.invoice_date,
                invoiceTime: data.invoice_time,
                customerId: data.customer_id,
                customerName: data.customer_name,
                customerMobile: data.customer_mobile,
                customerGstin: data.customer_gstin,
                isInterstate: Boolean(data.is_interstate),
                items: Array.isArray(data.items)
                  ? data.items.map((it) => ({
                      productId: it.product_id,
                      productName: it.product_name,
                      productCode: it.product_code,
                      hsnCode: it.hsn_code,
                      unit: it.unit,
                      quantity: it.quantity,
                      unitPrice: it.unit_price,
                      discountPercent: it.discount_percent,
                      discountAmount: it.discount_amount,
                      taxableValue: it.taxable_value,
                      gstRate: it.gst_rate,
                      cgstRate: it.cgst_rate,
                      cgstAmount: it.cgst_amount,
                      sgstRate: it.sgst_rate,
                      sgstAmount: it.sgst_amount,
                      igstRate: it.igst_rate,
                      igstAmount: it.igst_amount,
                      totalAmount: it.total_amount,
                    }))
                  : [],
                subtotal: data.subtotal,
                itemDiscountTotal: data.item_discount_total,
                invoiceDiscountTotal: data.invoice_discount_total,
                taxableAmount: data.taxable_amount,
                cgstTotal: data.cgst_total,
                sgstTotal: data.sgst_total,
                igstTotal: data.igst_total,
                grandTotal: data.grand_total,
                roundOff: data.round_off,
                amountReceived: data.amount_received,
                balanceDue: data.balance_due,
                paymentMethod: data.payment_method,
                paymentStatus: data.payment_status,
                status: data.status || 'ACTIVE',
                notes: data.notes,
                cancellationReason: data.cancellation_reason,
                cancelledAt: data.cancelled_at,
                updatedAtLocal: data.updated_at || new Date().toISOString(),
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
              productId: data.product_id,
              productName: data.product_name,
              movementType: data.movement_type,
              quantity: data.quantity,
              previousStock: data.previous_stock,
              newStock: data.new_stock,
              referenceType: data.reference_type,
              referenceId: data.reference_id,
              notes: data.notes,
              createdAtLocal: data.created_at || new Date().toISOString(),
            },
            { upsert: true, new: true }
          );
          syncedQueueIds.push(queueId);
        }
      } catch (mutationErr) {
        console.error(`[Sync] Error syncing item ${queueId}:`, mutationErr);
      }
    }

    res.json({
      success: true,
      syncedQueueIds,
      processedCount: syncedQueueIds.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function pullSync(req, res, next) {
  try {
    const businessId = req.businessId;
    const { since } = req.query;

    const filter = { businessId };
    if (since) {
      filter.updatedAt = { $gt: new Date(since) };
    }

    const [products, customers, invoices, movements] = await Promise.all([
      Product.find(filter).lean(),
      Customer.find(filter).lean(),
      Invoice.find(filter).lean(),
      StockMovement.find(filter).lean(),
    ]);

    res.json({
      success: true,
      delta: {
        products,
        customers,
        invoices,
        movements,
      },
      pulledAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getSyncOverview(req, res, next) {
  try {
    const businessId = req.businessId;
    const [productCount, customerCount, invoiceCount] = await Promise.all([
      Product.countDocuments({ businessId }),
      Customer.countDocuments({ businessId }),
      Invoice.countDocuments({ businessId }),
    ]);

    res.json({
      success: true,
      stats: {
        cloudProducts: productCount,
        cloudCustomers: customerCount,
        cloudInvoices: invoiceCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
