import mongoose from 'mongoose';

const DailyCompletionSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  completedTodos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
  score: { type: Number, default: 0 },
  totalPossibleScore: { type: Number, default: 0 }, // Total possible score for the day
});

export default mongoose.models.DailyCompletion || mongoose.model('DailyCompletion', DailyCompletionSchema);
