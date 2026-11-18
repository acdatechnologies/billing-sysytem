import mongoose from 'mongoose';

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vnd_tech_billing';

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn('[Database] MongoDB connection warning:', error.message);
    console.log('[Database] Note: Server is running in resilient standby mode for local testing.');
    return null;
  }
}
