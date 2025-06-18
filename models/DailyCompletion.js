import mongoose from 'mongoose';

const DailyCompletionSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  date: { type: Date, required: true },
  completedTodos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
  score: { type: Number, default: 0 },
  totalPossibleScore: { type: Number, default: 0 }, // Total possible score for the day
});

// Create compound index for efficient user-specific queries
DailyCompletionSchema.index({ userId: 1, date: -1 });

// Ensure uniqueness per user per date
DailyCompletionSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyCompletion || mongoose.model('DailyCompletion', DailyCompletionSchema);
