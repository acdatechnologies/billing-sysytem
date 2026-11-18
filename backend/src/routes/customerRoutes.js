import express from 'express';
import {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { validateCustomerBody } from '../middleware/validate.js';

export const customerRouter = express.Router();

customerRouter.get('/', listCustomers);
customerRouter.get('/:id', getCustomerById);
customerRouter.post('/', validateCustomerBody, createCustomer);
customerRouter.put('/:id', validateCustomerBody, updateCustomer);
customerRouter.delete('/:id', deleteCustomer);
