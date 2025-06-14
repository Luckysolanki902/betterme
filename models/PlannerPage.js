// models/PlannerPage.js
import mongoose from 'mongoose';

// Define the block schema for content blocks (paragraphs, headings, lists, etc.)
const ContentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['heading1', 'heading2', 'heading3', 'body1', 'body2', 'body3', 'bulletedList', 'numberedList', 'embed'],
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  // For lists, we'll store an array of list items
  listItems: [{
    content: String,
    subItems: [{
      content: String,
    }],
  }],
  // For embedded pages
  embeddedPageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlannerPage',
  },
}, { _id: true });

// Define the planner page schema
const PlannerPageSchema = new mongoose.Schema(
  {    title: { type: String, required: true },
    description: { type: String, default: '' },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlannerPage',
      default: null,
    },    isEmbedded: { type: Boolean, default: false }, // For pages embedded within other pages
    snippet: { type: String, default: '' }, // Short preview of content for listings
    content: [ContentBlockSchema],
    // Keep track of child pages for quick access
    childPages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlannerPage',
    }],
    position: { type: Number, default: 0 }, // For ordering pages
  },
  { timestamps: true }
);

// Add indexes
PlannerPageSchema.index({ title: 'text', description: 'text' });
PlannerPageSchema.index({ parentId: 1 });

// Ensure model recompilation prevention in development
delete mongoose.connection.models['PlannerPage'];

export default mongoose.models.PlannerPage || mongoose.model('PlannerPage', PlannerPageSchema);
