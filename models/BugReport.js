import mongoose from 'mongoose';

const BugReportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bug', 'feedback'],
    required: true,
    default: 'bug'
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  userAgent: {
    type: String,
    maxlength: 500,
  },
  ipAddress: {
    type: String,
    maxlength: 45,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Index for efficient querying
BugReportSchema.index({ type: 1, status: 1, submittedAt: -1 });

export default mongoose.models.BugReport || mongoose.model('BugReport', BugReportSchema);
