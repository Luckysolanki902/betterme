import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  percentage: { 
    type: Number, 
    required: true, 
    min: [0, 'Percentage must be at least 0'], 
    max: [100, 'Percentage must be at most 100'] // Updated to allow up to 100
  },
  completed: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: () => new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) },
  priority: { type: Number, default: 0 } // Default priority
});

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
