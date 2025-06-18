// models/Todo.js
import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true, 
      index: true 
    },
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
    priority: { type: Number, default: 0 },
    category: { type: String, required: true, index: true },
  },
  { timestamps: true } // Enable automatic createdAt and updatedAt fields
);

// Create compound index for efficient user-specific queries
TodoSchema.index({ userId: 1, category: 1 });
TodoSchema.index({ userId: 1, completed: 1 });
TodoSchema.index({ userId: 1, createdAt: -1 });

// Ensure model recompilation prevention in development
delete mongoose.connection.models['Todo'];

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
