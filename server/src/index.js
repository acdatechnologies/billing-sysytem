import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { authRouter } from './routes/authRoutes.js';
import { syncRouter } from './routes/syncRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vnd_tech_billing';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'VND Tech Billing Cloud Synchronization API',
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/sync', syncRouter);

// Connect to MongoDB Atlas
if (process.env.MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('[Cloud DB] Connected securely to MongoDB Atlas.');
    })
    .catch((err) => {
      console.warn('[Cloud DB] MongoDB connection warning:', err.message);
      console.log('[Cloud DB] Note: Server is running in resilient standby mode for local testing.');
    });
} else {
  console.log('[Cloud DB] Running with MONGODB_URI unconfigured. Set MONGODB_URI in .env to connect to your live Atlas cluster.');
}

app.listen(PORT, () => {
  console.log(`[Cloud Server] VND Tech Cloud API running on port ${PORT}`);
});
