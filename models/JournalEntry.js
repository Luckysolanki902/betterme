// models/JournalEntry.js
import mongoose from 'mongoose';

// Define the content block schema for rich text content in journal entries
const ContentBlockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['paragraph', 'heading1', 'heading2', 'heading3', 'bulletList', 'numberedList', 'quote', 'code'],
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  // For lists
  listItems: [{
    content: String,
    checked: {
      type: Boolean,
      default: false
    }
  }],
  // For any additional attributes (like image URLs, alignment, etc.)
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

// Define tags schema for categorizing journal entries
const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: '#3f51b5',
  }
});

// Define the journal entry schema
const JournalEntrySchema = new mongoose.Schema(
  {
    // The date for this journal entry (year, month, day - no time)
    entryDate: { 
      type: Date, 
      required: true,
      index: true
    },
    // Optional title for the entry
    title: { 
      type: String, 
      default: '' 
    },
    // Rich text content blocks
    content: [ContentBlockSchema],
    // Mood/emotion tracking (1-10 scale or specific emotion)
    mood: {
      score: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      },
      label: {
        type: String,
        default: 'neutral'
      }
    },
    // Tags for categorization
    tags: [TagSchema],
    // Metadata
    wordCount: {
      type: Number,
      default: 0
    },
    // Track when the user last modified this entry
    lastEditedAt: {
      type: Date,
      default: Date.now
    },
    // User specific (we'll use this for encryption)
    userId: {
      type: String,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

// Create compound index for efficient querying by userId and entryDate
JournalEntrySchema.index({ userId: 1, entryDate: -1 });

// Ensure entries are unique per day per user
JournalEntrySchema.index({ userId: 1, entryDate: 1 }, { unique: true });

// Check if the model exists before creating it (for Next.js hot reloading)
export default mongoose.models.JournalEntry || mongoose.model('JournalEntry', JournalEntrySchema);
