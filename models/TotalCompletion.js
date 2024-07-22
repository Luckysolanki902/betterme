import mongoose from 'mongoose';

const TotalCompletionSchema = new mongoose.Schema({
  totalPercentage: { type: Number, default: 0 },
});

export default mongoose.models.TotalCompletion || mongoose.model('TotalCompletion', TotalCompletionSchema);
