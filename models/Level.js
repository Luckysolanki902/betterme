import mongoose from 'mongoose';

const LevelSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  noOfDays: { type: Number, required: true },
  endDate: { type: Date, required: true },
  level: { type: Number, required: true },
  levelName: { type: String, required: true },
  improvedPercentage: { type: Number, default: 0 },
});

export default mongoose.models.Level || mongoose.model('Level', LevelSchema);