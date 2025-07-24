// @/middleware/connectToMongo.js
import mongoose from "mongoose";

// Global variable to track connection promise
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      maxIdleTimeMS: 30000,
      bufferCommands: true,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

const connectToMongo = (handler) => async (req, res) => {
  try {
    await connectToDatabase();
    return handler(req, res);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return res.status(500).json({ 
      error: 'Database connection error', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export default connectToMongo;
