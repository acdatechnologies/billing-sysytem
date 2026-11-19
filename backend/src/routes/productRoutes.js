import express from 'express';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  getNextCode,
} from '../controllers/productController.js';
import { validateProductBody } from '../middleware/validate.js';

export const productRouter = express.Router();

// Categories
productRouter.get('/categories', listCategories);
productRouter.post('/categories', createCategory);

// Products Next Sequential Code
productRouter.get('/next-code', getNextCode);

// Products CRUD
productRouter.get('/', listProducts);
productRouter.get('/:id', getProductById);
productRouter.post('/', validateProductBody, createProduct);
productRouter.put('/:id', validateProductBody, updateProduct);
productRouter.delete('/:id', deleteProduct);
