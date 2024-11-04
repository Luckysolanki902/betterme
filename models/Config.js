// models/Config.js
import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  totalPercentage: { type: Number, default: 0 },
  startDate: { type: Date, default: null },
  categories: { 
    type: [String], 
    default: ['Morning Routine', 'Hygiene', 'Work', 'Health', 'Study', 'Discipline', "Communication Skills", "Personality & Behavior", "Extra", "Knowledge"] // Default categories
  },
});

const Config = mongoose.models.Config || mongoose.model('Config', ConfigSchema);
export default Config;
