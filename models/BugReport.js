import mongoose from 'mongoose';

const BugReportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bug', 'feature'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  stepsToReproduce: {
    type: String,
    maxlength: 1000,
  },
  expectedBehavior: {
    type: String,
    maxlength: 500,
  },
  actualBehavior: {
    type: String,
    maxlength: 500,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  browser: {
    type: String,
    maxlength: 100,
  },
  os: {
    type: String,
    maxlength: 100,
  },
  email: {
    type: String,
    maxlength: 255,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    },
  },
  additionalInfo: {
    type: String,
    maxlength: 1000,
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
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Index for efficient querying
BugReportSchema.index({ type: 1, status: 1, submittedAt: -1 });
BugReportSchema.index({ severity: 1, priority: 1 });

export default mongoose.models.BugReport || mongoose.model('BugReport', BugReportSchema);
