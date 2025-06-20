// models/PlannerPage.js
import mongoose from 'mongoose';

// Define the schema for Lexical editor content
// Lexical stores content as a JSON structure
const LexicalContentSchema = new mongoose.Schema({
  // The complete Lexical editor state as a JSON string
  editorState: {
    type: String, // JSON stringified Lexical editor state
    default: '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
  }
}, { _id: false });

// Define the planner page schema
const PlannerPageSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true, 
      index: true 
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlannerPage',
      default: null,
    },
    isEmbedded: { type: Boolean, default: false }, // For pages embedded within other pages    snippet: { type: String, default: '' }, // Short preview of content for listings
    content: LexicalContentSchema,
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
PlannerPageSchema.index({ userId: 1, title: 'text', description: 'text' });
PlannerPageSchema.index({ userId: 1, parentId: 1 });
PlannerPageSchema.index({ userId: 1, createdAt: -1 });

// Ensure model recompilation prevention in development
delete mongoose.connection.models['PlannerPage'];

export default mongoose.models.PlannerPage || mongoose.model('PlannerPage', PlannerPageSchema);
