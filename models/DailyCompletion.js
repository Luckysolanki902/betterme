import mongoose from 'mongoose';

const DailyCompletionSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  completedTodos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
  percentage: { type: Number, default: 0 },
});

export default mongoose.models.DailyCompletion || mongoose.model('DailyCompletion', DailyCompletionSchema);
