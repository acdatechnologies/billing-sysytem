import { Customer } from '../models/Customer.js';

function normalizeCustomerInput(data, businessId, existingId) {
  const customerId = existingId || data.customerId || data.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    customerId,
    businessId: businessId || 'default',
    name: (data.name || '').trim(),
    mobile: (data.mobile || '').trim().replace(/\D/g, ''),
    email: (data.email || '').trim().toLowerCase(),
    address: (data.address || '').trim(),
    gstin: (data.gstin || '').trim().toUpperCase(),
    totalPurchases: Number(data.totalPurchases || data.total_purchases) || 0,
    totalBills: Number(data.totalBills || data.total_bills) || 0,
    lastPurchaseDate: data.lastPurchaseDate || data.last_purchase_date || '',
    whatsappConsent: data.whatsappConsent !== undefined ? data.whatsappConsent : (data.whatsapp_consent !== undefined ? data.whatsapp_consent : 1),
    updatedAtLocal: new Date().toISOString(),
  };
}

function formatCustomer(doc) {
  if (!doc) return null;
  const c = doc.toObject ? doc.toObject() : doc;
  return {
    ...c,
    id: c.customerId || c._id?.toString(),
    business_id: c.businessId,
    total_purchases: c.totalPurchases,
    total_bills: c.totalBills,
    last_purchase_date: c.lastPurchaseDate,
    whatsapp_consent: c.whatsappConsent,
  };
}

export async function listCustomers(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const { search } = req.query;

    const query = { businessId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ updatedAt: -1 });
    const formatted = customers.map(formatCustomer);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const customer = await Customer.findOne({
      $or: [{ customerId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      businessId,
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: formatCustomer(customer) });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const payload = normalizeCustomerInput(req.body, businessId);

    // Deduplication check by mobile
    const existing = await Customer.findOne({ businessId, mobile: payload.mobile });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Customer with mobile ${payload.mobile} already exists (${existing.name}).`,
      });
    }

    const newCustomer = new Customer(payload);
    await newCustomer.save();
    res.status(201).json({ success: true, data: formatCustomer(newCustomer) });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const payload = normalizeCustomerInput(req.body, businessId, id);

    const updated = await Customer.findOneAndUpdate(
      { $or: [{ customerId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }], businessId },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: formatCustomer(updated) });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';

    const deleted = await Customer.findOneAndDelete({
      $or: [{ customerId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      businessId,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
