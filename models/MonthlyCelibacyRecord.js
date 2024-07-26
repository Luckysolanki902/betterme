// @/models/DailyCelibacyRecord.js

import mongoose from 'mongoose';
import dailyRecordSchema from './DailyCelibacyRecord';

const { Schema } = mongoose;

const monthlyRecordSchema = new Schema({
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  dailyRecords: {
    type: [dailyRecordSchema],
    required: true,
    validate: [arrayLimit, 'Exceeds the limit of 31 days']
  }
}, {
  timestamps: true
});

function arrayLimit(val) {
  return val.length <= 31;
}

const MonthlyCelibacyRecord = mongoose.models.MonthlyCelibacyRecord || mongoose.model('MonthlyCelibacyRecord', monthlyRecordSchema);

export default MonthlyCelibacyRecord;
