import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

function normalizeProductInput(data, businessId, existingProductId) {
  const sellingPrice = data.sellingPrice !== undefined ? Number(data.sellingPrice) : Number(data.selling_price);
  const purchasePrice = data.purchasePrice !== undefined
    ? Number(data.purchasePrice)
    : (data.purchase_price !== undefined ? Number(data.purchase_price) : 0);
  const currentStock = data.currentStock !== undefined
    ? Number(data.currentStock)
    : (data.current_stock !== undefined
        ? Number(data.current_stock)
        : (data.opening_stock !== undefined ? Number(data.opening_stock) : 0));
  const minimumStock = data.minimumStock !== undefined
    ? Number(data.minimumStock)
    : (data.minimum_stock !== undefined ? Number(data.minimum_stock) : 5);
  const gstRate = data.gstRate !== undefined
    ? Number(data.gstRate)
    : (data.gst_rate !== undefined ? Number(data.gst_rate) : 18);
  const productId = existingProductId || data.productId || data.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  return {
    productId,
    businessId: businessId || 'default',
    name: (data.name || '').trim(),
    code: (data.code || '').trim().toUpperCase(),
    barcode: (data.barcode || '').trim(),
    categoryId: data.categoryId || data.category_id || '',
    categoryName: data.categoryName || data.category_name || '',
    unit: data.unit || 'PCS',
    purchasePrice: isNaN(purchasePrice) ? 0 : purchasePrice,
    sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
    currentStock: isNaN(currentStock) ? 0 : currentStock,
    minimumStock: isNaN(minimumStock) ? 5 : minimumStock,
    gstRate: isNaN(gstRate) ? 18 : gstRate,
    hsnCode: (data.hsnCode || data.hsn_code || '').trim(),
    isActive: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : 1),
    updatedAtLocal: new Date().toISOString(),
  };
}

function formatProduct(doc) {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...p,
    id: p.productId || p._id?.toString(),
    business_id: p.businessId,
    name: p.name,
    code: p.code,
    barcode: p.barcode || '',
    unit: p.unit || 'PCS',
    selling_price: p.sellingPrice,
    sellingPrice: p.sellingPrice,
    purchase_price: p.purchasePrice,
    purchasePrice: p.purchasePrice,
    current_stock: p.currentStock,
    currentStock: p.currentStock,
    opening_stock: p.currentStock,
    minimum_stock: p.minimumStock,
    minimumStock: p.minimumStock,
    gst_rate: p.gstRate,
    gstRate: p.gstRate,
    hsn_code: p.hsnCode || '',
    hsnCode: p.hsnCode || '',
    category_id: p.categoryId || '',
    categoryId: p.categoryId || '',
    category_name: p.categoryName || '',
    categoryName: p.categoryName || '',
    is_active: p.isActive,
    isActive: p.isActive,
  };
}

export async function listProducts(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const { search, categoryId, stockStatus } = req.query;

    const query = { businessId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (stockStatus === 'OUT') {
      query.currentStock = { $lte: 0 };
    } else if (stockStatus === 'LOW') {
      query.$expr = {
        $and: [
          { $gt: ['$currentStock', 0] },
          { $lte: ['$currentStock', '$minimumStock'] },
        ],
      };
    } else if (stockStatus === 'HEALTHY') {
      query.$expr = { $gt: ['$currentStock', '$minimumStock'] };
    }

    const products = await Product.find(query).sort({ updatedAt: -1 });
    const formatted = products.map(formatProduct);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const product = await Product.findOne({
      $or: [{ productId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      businessId,
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, data: formatProduct(product) });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const payload = normalizeProductInput(req.body, businessId);

    // Check code uniqueness
    const existing = await Product.findOne({ businessId, code: payload.code });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Product with code "${payload.code}" already exists.`,
      });
    }

    const newProduct = new Product(payload);
    await newProduct.save();

    res.status(201).json({ success: true, data: formatProduct(newProduct) });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const payload = normalizeProductInput(req.body, businessId, id);

    const updated = await Product.findOneAndUpdate(
      { $or: [{ productId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }], businessId },
      payload,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, data: formatProduct(updated) });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';

    const deleted = await Product.findOneAndDelete({
      $or: [{ productId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      businessId,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function listCategories(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const categories = await Category.find({ businessId }).sort({ name: 1 });
    const formatted = categories.map((c) => ({
      ...c.toObject(),
      id: c.categoryId || c._id?.toString(),
    }));
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const categoryId = `cat_${Date.now()}`;
    const category = new Category({
      categoryId,
      businessId,
      name: name.trim(),
      description: (description || '').trim(),
    });

    await category.save();
    res.status(201).json({
      success: true,
      data: {
        ...category.toObject(),
        id: category.categoryId,
      },
    });
  } catch (err) {
    next(err);
  }
}
