/**
 * Centralized Validation Engine for VND Tech Billing Software
 * Validates Products, Customers, Invoices, Stock Adjustments, and Business Settings.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 1. Mobile Number Validator (Indian 10-digit standards)
export function validateMobile(mobile: string | undefined | null, required = false): string | null {
  if (!mobile || !mobile.trim()) {
    return required ? 'Mobile number is required.' : null;
  }
  const cleaned = mobile.trim().replace(/\D/g, '');
  // Allow leading 0 or 91
  const normalized = cleaned.length === 12 && cleaned.startsWith('91')
    ? cleaned.slice(2)
    : cleaned.length === 11 && cleaned.startsWith('0')
    ? cleaned.slice(1)
    : cleaned;

  if (normalized.length !== 10) {
    return 'Mobile number must be exactly 10 digits.';
  }
  if (!/^[6-9]\d{9}$/.test(normalized)) {
    return 'Mobile number must start with 6, 7, 8, or 9.';
  }
  return null;
}

// 2. GSTIN Validator (15-character Indian GST format)
export function validateGSTIN(gstin: string | undefined | null, required = false): string | null {
  if (!gstin || !gstin.trim()) {
    return required ? 'GSTIN is required.' : null;
  }
  const cleanGST = gstin.trim().toUpperCase();
  if (cleanGST.length !== 15) {
    return 'GSTIN must be exactly 15 alphanumeric characters.';
  }
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(cleanGST)) {
    return 'Invalid GSTIN format (e.g., 33AAAAA0000A1Z5).';
  }
  return null;
}

// 3. Email Validator
export function validateEmail(email: string | undefined | null, required = false): string | null {
  if (!email || !email.trim()) {
    return required ? 'Email address is required.' : null;
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

// 4. Product Input Validator
export interface ProductValidationInput {
  name?: string;
  code?: string;
  selling_price?: number | string;
  purchase_price?: number | string;
  current_stock?: number | string;
  minimum_stock?: number | string;
  gst_rate?: number | string;
  hsn_code?: string;
}

export function validateProduct(data: ProductValidationInput): ValidationResult {
  const errors: Record<string, string> = {};

  // Name
  if (!data.name || !data.name.trim()) {
    errors.name = 'Product name is required.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Product name must be at least 2 characters.';
  }

  // Code / SKU
  if (!data.code || !data.code.trim()) {
    errors.code = 'Product code (SKU) is required.';
  } else if (!/^[A-Za-z0-9-_/]+$/.test(data.code.trim())) {
    errors.code = 'Product code can only contain letters, numbers, hyphens, and underscores.';
  }

  // Selling Price
  const sellingPrice = Number(data.selling_price);
  if (isNaN(sellingPrice)) {
    errors.selling_price = 'Selling price must be a valid number.';
  } else if (sellingPrice <= 0) {
    errors.selling_price = 'Selling price must be greater than ₹0.';
  }

  // Purchase Price
  const purchasePrice = Number(data.purchase_price) || 0;
  if (isNaN(purchasePrice) || purchasePrice < 0) {
    errors.purchase_price = 'Purchase price cannot be negative.';
  } else if (sellingPrice > 0 && purchasePrice > sellingPrice) {
    errors.purchase_price = 'Warning: Purchase price is higher than selling price.';
  }

  // Stock
  if (data.current_stock !== undefined && data.current_stock !== '') {
    const stock = Number(data.current_stock);
    if (isNaN(stock) || stock < 0) {
      errors.current_stock = 'Current stock cannot be negative.';
    }
  }

  // Min Stock
  if (data.minimum_stock !== undefined && data.minimum_stock !== '') {
    const minStock = Number(data.minimum_stock);
    if (isNaN(minStock) || minStock < 0) {
      errors.minimum_stock = 'Minimum alert stock cannot be negative.';
    }
  }

  // GST Rate
  if (data.gst_rate !== undefined && data.gst_rate !== '') {
    const rate = Number(data.gst_rate);
    const validGSTRates = [0, 0.1, 0.25, 1.5, 3, 5, 12, 18, 28];
    if (isNaN(rate) || rate < 0 || rate > 100) {
      errors.gst_rate = 'GST rate must be between 0% and 100%.';
    } else if (!validGSTRates.includes(rate)) {
      // Allow custom, but advise
    }
  }

  // HSN Code
  if (data.hsn_code && data.hsn_code.trim()) {
    const hsn = data.hsn_code.trim();
    if (!/^\d{2,8}$/.test(hsn)) {
      errors.hsn_code = 'HSN Code should be 2 to 8 digits (e.g., 8443, 8528).';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 5. Customer Input Validator
export interface CustomerValidationInput {
  name?: string;
  mobile?: string;
  email?: string;
  gstin?: string;
}

export function validateCustomer(data: CustomerValidationInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Customer name is required.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Customer name must be at least 2 characters.';
  }

  const mobileErr = validateMobile(data.mobile, true);
  if (mobileErr) {
    errors.mobile = mobileErr;
  }

  const emailErr = validateEmail(data.email, false);
  if (emailErr) {
    errors.email = emailErr;
  }

  const gstinErr = validateGSTIN(data.gstin, false);
  if (gstinErr) {
    errors.gstin = gstinErr;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 6. Invoice & Billing Validator
export interface InvoiceValidationInput {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  customerName?: string;
  customerMobile?: string;
  customerGstin?: string;
  paymentMethod?: string;
  amountReceived?: number;
  grandTotal?: number;
}

export function validateInvoice(data: InvoiceValidationInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.items || data.items.length === 0) {
    errors.items = 'Please add at least one product to the invoice.';
  } else {
    data.items.forEach((item, index) => {
      if (!item.productId) {
        errors[`item_${index}_product`] = `Item #${index + 1} has an invalid product reference.`;
      }
      if (!item.quantity || item.quantity <= 0) {
        errors[`item_${index}_qty`] = `Item #${index + 1} (${item.productName || 'Product'}) must have quantity > 0.`;
      }
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        errors[`item_${index}_price`] = `Item #${index + 1} (${item.productName || 'Product'}) must have a valid price.`;
      }
    });
  }

  if (!data.customerName || !data.customerName.trim()) {
    errors.customerName = 'Customer name is required (use "Walk-in Customer" if unspecified).';
  }

  if (data.customerMobile && data.customerMobile.trim()) {
    const mobErr = validateMobile(data.customerMobile, false);
    if (mobErr) errors.customerMobile = mobErr;
  }

  if (data.customerGstin && data.customerGstin.trim()) {
    const gstErr = validateGSTIN(data.customerGstin, false);
    if (gstErr) errors.customerGstin = gstErr;
  }

  const validPayments = ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'CREDIT'];
  if (data.paymentMethod && !validPayments.includes(data.paymentMethod)) {
    errors.paymentMethod = `Invalid payment method. Must be one of: ${validPayments.join(', ')}.`;
  }

  if (data.amountReceived !== undefined) {
    if (data.amountReceived < 0) {
      errors.amountReceived = 'Negative values are not allowed (எதிர்மறை எண்கள் அனுமதிக்கப்படாது).';
    } else if (data.grandTotal !== undefined && data.grandTotal > 0 && data.amountReceived > data.grandTotal) {
      errors.amountReceived = `நீங்கள் மொத்த தொகையை (₹${data.grandTotal}) விட அதிகமாக pay பண்ண போறீங்க!`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 7. Stock Adjustment Validator
export interface StockAdjustmentValidationInput {
  productId?: string;
  movementType?: string;
  quantity?: number;
  currentStock?: number;
  notes?: string;
}

export function validateStockAdjustment(data: StockAdjustmentValidationInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.productId) {
    errors.productId = 'Product is required for stock adjustment.';
  }

  const validTypes = ['RESTOCK', 'DAMAGE', 'RETURN', 'AUDIT_CORRECTION', 'IN', 'OUT'];
  if (!data.movementType || !validTypes.includes(data.movementType)) {
    errors.movementType = `Invalid adjustment type. Allowed: ${validTypes.join(', ')}.`;
  }

  const qty = Number(data.quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.quantity = 'Adjustment quantity must be greater than zero.';
  }

  // Prevent stock from going negative on damages/removals
  if (data.movementType === 'DAMAGE' || data.movementType === 'OUT') {
    const current = Number(data.currentStock) || 0;
    if (qty > current) {
      errors.quantity = `Cannot deduct ${qty} units. Only ${current} units available in inventory.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
