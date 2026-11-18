import express from 'express';
import {
  getInventorySummary,
  getStockMovements,
  adjustStock,
} from '../controllers/inventoryController.js';
import { validateStockAdjustmentBody } from '../middleware/validate.js';

export const inventoryRouter = express.Router();

inventoryRouter.get('/summary', getInventorySummary);
inventoryRouter.get('/movements', getStockMovements);
inventoryRouter.post('/adjust', validateStockAdjustmentBody, adjustStock);
