import express from 'express';
import { authRouter } from './authRoutes.js';
import { productRouter } from './productRoutes.js';
import { customerRouter } from './customerRoutes.js';
import { invoiceRouter } from './invoiceRoutes.js';
import { inventoryRouter } from './inventoryRoutes.js';
import { dashboardRouter } from './dashboardRoutes.js';
import { syncRouter } from './syncRoutes.js';

export const apiRouter = express.Router();

// Mount all modular routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/sync', syncRouter);
