import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

export async function listProducts(req, res, next) {
  try {
    const businessId = req.businessId;
    const { search, categoryId, stockStatus } = req.query;

    const query = { businessId: businessId || 'default' };

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
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';
    const product = await Product.findOne({ productId: id, businessId });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const data = req.body;
    const productId = data.productId || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newProduct = new Product({
      ...data,
      productId,
      businessId,
      updatedAtLocal: new Date().toISOString(),
    });

    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';

    const updated = await Product.findOneAndUpdate(
      { productId: id, businessId },
      { ...req.body, updatedAtLocal: new Date().toISOString() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const businessId = req.businessId || 'default';

    const deleted = await Product.findOneAndDelete({ productId: id, businessId });
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
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const businessId = req.businessId || 'default';
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const categoryId = `cat_${Date.now()}`;
    const category = new Category({
      categoryId,
      businessId,
      name,
      description: description || '',
    });

    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}
