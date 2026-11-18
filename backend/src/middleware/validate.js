/**
 * Express Request Validation Middleware for VND Tech Billing API
 */

export function validateProductBody(req, res, next) {
  const { name, code, sellingPrice, selling_price, gstRate, gst_rate } = req.body;
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = 'Product name is required.';
  } else if (name.trim().length < 2) {
    errors.name = 'Product name must be at least 2 characters.';
  }

  const finalCode = code || req.body.code;
  if (!finalCode || !finalCode.trim()) {
    errors.code = 'Product code (SKU) is required.';
  }

  const price = sellingPrice !== undefined ? sellingPrice : selling_price;
  if (price === undefined || isNaN(Number(price))) {
    errors.sellingPrice = 'Selling price is required and must be a number.';
  } else if (Number(price) <= 0) {
    errors.sellingPrice = 'Selling price must be greater than 0.';
  }

  const gst = gstRate !== undefined ? gstRate : gst_rate;
  if (gst !== undefined && (isNaN(Number(gst)) || Number(gst) < 0 || Number(gst) > 100)) {
    errors.gstRate = 'GST rate must be between 0% and 100%.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Product validation failed.',
      errors,
    });
  }

  next();
}

export function validateCustomerBody(req, res, next) {
  const { name, mobile, email, gstin } = req.body;
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = 'Customer name is required.';
  }

  if (!mobile || !mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  } else {
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    const normMobile = cleanMobile.length === 12 && cleanMobile.startsWith('91')
      ? cleanMobile.slice(2)
      : cleanMobile;
    if (normMobile.length !== 10) {
      errors.mobile = 'Mobile number must be exactly 10 digits.';
    } else if (!/^[6-9]\d{9}$/.test(normMobile)) {
      errors.mobile = 'Mobile number must start with 6, 7, 8, or 9.';
    }
  }

  if (email && email.trim()) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Invalid email address format.';
    }
  }

  if (gstin && gstin.trim()) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(gstin.trim().toUpperCase())) {
      errors.gstin = 'Invalid Indian GSTIN format (e.g. 33AAAAA0000A1Z5).';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Customer validation failed.',
      errors,
    });
  }

  next();
}

export function validateInvoiceBody(req, res, next) {
  const { items, customerName, grandTotal, paymentMethod } = req.body;
  const errors = {};

  if (!Array.isArray(items) || items.length === 0) {
    errors.items = 'An invoice must contain at least one line item.';
  } else {
    items.forEach((it, idx) => {
      if (!it.productId) {
        errors[`items[${idx}].productId`] = 'Product ID is required for each line item.';
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        errors[`items[${idx}].quantity`] = 'Quantity must be greater than zero.';
      }
      const price = it.unitPrice !== undefined ? it.unitPrice : it.unit_price;
      if (price === undefined || Number(price) < 0) {
        errors[`items[${idx}].unitPrice`] = 'Unit price cannot be negative.';
      }
    });
  }

  if (paymentMethod) {
    const valid = ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT'];
    if (!valid.includes(paymentMethod)) {
      errors.paymentMethod = `Invalid payment method. Must be one of: ${valid.join(', ')}.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invoice validation failed.',
      errors,
    });
  }

  next();
}

export function validateStockAdjustmentBody(req, res, next) {
  const { productId, movementType, quantity } = req.body;
  const errors = {};

  if (!productId) {
    errors.productId = 'Product ID is required.';
  }

  const validTypes = ['RESTOCK', 'DAMAGE', 'RETURN', 'AUDIT_CORRECTION', 'IN', 'OUT'];
  if (!movementType || !validTypes.includes(movementType)) {
    errors.movementType = `Invalid movement type. Allowed: ${validTypes.join(', ')}.`;
  }

  if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    errors.quantity = 'Quantity must be a positive number.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Stock adjustment validation failed.',
      errors,
    });
  }

  next();
}
