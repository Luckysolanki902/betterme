# Journal Feature Documentation

## Overview
The Journal feature allows users to create daily journal entries with rich text formatting, mood tracking, and tags. Entries are securely encrypted and can be viewed in a calendar interface.

## Features

### Calendar View
- Interactive calendar displays days with journal entries
- Days with entries are highlighted with the mood color
- Select any day to view or create an entry

### Rich Text Editor
- Format text with headings, paragraphs, lists, and quotes
- Add multiple content blocks of different types
- Auto-save functionality to prevent data loss
- Encrypted storage for privacy

### Mood Tracking
- Select from 8 different mood options
- Track emotional patterns over time
- View most common mood in statistics

### Tag System
- Add custom tags to categorize entries
- Assign colors to tags for visual organization
- Filter entries by tags (future enhancement)

### AI Writing Suggestions
- Get writing prompts if you're stuck
- Request reflection questions based on your entry
- Uses OpenAI's GPT-4o-mini model for intelligent suggestions

### Statistics Dashboard
- Track your journaling streak
- View total word count and entries
- See average words per entry
- Identify your most common mood

## Technical Implementation

### Data Model
- JournalEntry model with rich text content blocks
- Encryption for sensitive fields (title, content)
- User-specific entries with mood and tag support

### API Endpoints
- GET/POST/PUT/DELETE operations for journal entries
- Statistics calculation endpoint
- AI suggestions endpoint

### Encryption
- AES-256-CBC encryption for all sensitive content
- User-specific encryption keys
- Secure key derivation with PBKDF2

### Auto-Save
- Entries auto-save after 60 seconds of inactivity
- Manual save option always available
- Last edited timestamp tracking

## Usage Tips

1. **Regular Practice**: Try to write daily to build a journaling habit
2. **Use Writing Prompts**: If you're stuck, use the "Get Suggestions" button
3. **Track Mood Changes**: Select a mood for each entry to track emotional patterns
4. **Add Tags**: Organize entries with tags for better categorization
5. **Review Past Entries**: Use the calendar view to revisit previous entries and track growth

## Future Enhancements
- Search functionality across all journal entries
- Export/import of journal data
- More advanced text formatting options
- Mood analytics and charts
- Image embedding in journal entries
