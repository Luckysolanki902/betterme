// @/middleware/connectToMongo.js
import mongoose from "mongoose";

const connectToMongo = (handler) => async (req, res) => {
  try {
    if (mongoose.connections[0].readyState) {
      return handler(req, res);
    }
    
    // Set up connection options with retry logic
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB connected successfully');
    return handler(req, res);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return res.status(500).json({ error: 'Database connection error', details: error.message });
  }
};

export default connectToMongo;
