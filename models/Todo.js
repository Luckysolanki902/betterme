// models/Todo.js
import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    percentage: { 
      type: Number, 
      required: true, 
      min: [0, 'Percentage must be at least 0'], 
      max: [1, 'Percentage must be at most 1'] // Corrected max value
    },
    completed: { type: Boolean, default: false },
    priority: { type: Number, default: 0 }, // Default priority
    isColorful: { type: Boolean, default: false }, // New field
    category: { type: String, required: true }, // New field
  },
  { timestamps: true } // Enable automatic createdAt and updatedAt fields
);

// Ensure model recompilation prevention in development
delete mongoose.connection.models['Todo'];

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
