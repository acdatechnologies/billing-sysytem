import express from 'express';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
} from '../controllers/productController.js';

export const productRouter = express.Router();

// Categories
productRouter.get('/categories', listCategories);
productRouter.post('/categories', createCategory);

// Products CRUD
productRouter.get('/', listProducts);
productRouter.get('/:id', getProductById);
productRouter.post('/', createProduct);
productRouter.put('/:id', updateProduct);
productRouter.delete('/:id', deleteProduct);
