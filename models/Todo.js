// models/Todo.js
import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    difficulty: { 
      type: String, 
      required: true,
      enum: ['easy', 'light', 'medium', 'challenging', 'hard'],
      default: 'medium'
    },
    score: { 
      type: Number,
      required: true, 
      min: [1, 'Score must be at least 1'],
      max: [10, 'Score must be at most 10']
    },
    completed: { type: Boolean, default: false },
    priority: { type: Number, default: 0 }, // Default priority
    isColorful: { type: Boolean, default: false }, // New field
    category: { type: String, required: true, index: true }, // New field
  },
  { timestamps: true } // Enable automatic createdAt and updatedAt fields
);

// Ensure model recompilation prevention in development
delete mongoose.connection.models['Todo'];

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
