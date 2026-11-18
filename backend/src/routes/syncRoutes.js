import express from 'express';
import { authenticateBusiness } from '../middleware/auth.js';
import { pushSync, pullSync, getSyncOverview } from '../controllers/syncController.js';

export const syncRouter = express.Router();

// Protected sync routes
syncRouter.use(authenticateBusiness);

syncRouter.post('/push', pushSync);
syncRouter.get('/pull', pullSync);
syncRouter.get('/overview', getSyncOverview);
