// models/Config.js
import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  totalPercentage: { type: Number, default: 0 },
  startDate: { type: Date, default: null },
  categories: {
    type: [String],
    default: [
      "Mental & Emotional Wellbeing",
      "Morning Routine",
      "Study & Learning",
      "Discipline & Habits",
      "Social & Communication Skills",
      "Work & Career",
      "Physical Health & Fitness",
      "Recreation & Leisure",
      "Personal Development",
      "Self-Care & Hygiene",
      "Time Management"
    ]

  },
});

const Config = mongoose.models.Config || mongoose.model('Config', ConfigSchema);
export default Config;