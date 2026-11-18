import { Customer } from '../models/Customer.js';

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
    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const customer = await Customer.findOne({ customerId: id, businessId });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const data = req.body;
    const customerId = data.customerId || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newCustomer = new Customer({
      ...data,
      customerId,
      businessId,
      updatedAtLocal: new Date().toISOString(),
    });

    await newCustomer.save();
    res.status(201).json({ success: true, data: newCustomer });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';

    const updated = await Customer.findOneAndUpdate(
      { customerId: id, businessId },
      { ...req.body, updatedAtLocal: new Date().toISOString() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';

    const deleted = await Customer.findOneAndDelete({ customerId: id, businessId });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
