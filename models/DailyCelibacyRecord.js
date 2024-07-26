// @/models/DailyCelibacyRecord.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

const dailyRecordSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  celibacy: {
    type: Boolean,
    required: true
  },
  NotFallInTrap: {
    type: Boolean,
    required: true
  },
  notSearchForLustfulContent: {
    type: Boolean,
    required: true
  }
}, {
  _id: false  // To prevent creation of _id for subdocuments
});

export default dailyRecordSchema;
