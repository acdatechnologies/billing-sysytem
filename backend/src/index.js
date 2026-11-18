import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'VND Tech Billing REST API & Cloud Sync Engine',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED / STANDBY',
    timestamp: new Date().toISOString(),
  });
});

// Central API Router (v1)
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Connect to Database and Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Backend Server] VND Tech Billing API running on port ${PORT}`);
    console.log(`[Backend Server] Health check: http://localhost:${PORT}/api/health`);
  });
});
