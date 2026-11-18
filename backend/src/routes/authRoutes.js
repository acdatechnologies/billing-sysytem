import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticateBusiness } from '../middleware/auth.js';

export const authRouter = express.Router();

// Public routes
authRouter.post('/register', register);
authRouter.post('/login', login);

// Protected routes
authRouter.get('/me', authenticateBusiness, getProfile);
