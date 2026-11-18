import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';

export const dashboardRouter = express.Router();

dashboardRouter.get('/metrics', getDashboardMetrics);
