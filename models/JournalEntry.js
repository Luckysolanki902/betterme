// models/JournalEntry.js
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
    },    // Lexical editor content
    content: LexicalContentSchema,
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
