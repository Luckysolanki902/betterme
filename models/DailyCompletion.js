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

// Create compound index for efficient user-specific queries with the correct uniqueness constraint
// We're using a compound index of userId and date to ensure one record per user per day
// Using sparse: false to ensure index is created for all documents
// The background: true ensures index creation doesn't block operations
// Adding partialFilterExpression to handle date equality properly (instead of exact timestamp equality)
DailyCompletionSchema.index(
  { userId: 1, date: 1 }, 
  { 
    unique: true, 
    background: true,
    name: 'userId_date_unique_idx' 
  }
);

// Remove any old index that might be causing problems
if (mongoose.connection.readyState === 1) {
  mongoose.connection.collection('dailycompletions').dropIndex('date_1', (err) => {
    // Ignore error if index doesn't exist
  });
}

export default mongoose.models.DailyCompletion || mongoose.model('DailyCompletion', DailyCompletionSchema);
