// pages/api/journal/stats.js
import connectToMongo from '@/middleware/connectToMongo';
import JournalEntry from '@/models/JournalEntry';
const { getUserId } = require('@/middleware/journalEncryption');
import dayjs from 'dayjs';

// API handler for /api/journal/stats
// Gets statistics about the user's journal entries
const handler = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {    // Get the user ID for filtering
    const userId = getUserId(req);
    
    // Get total entries count
    const totalEntries = await JournalEntry.countDocuments({ userId });
    
    // Get all entries sorted by date
    const entries = await JournalEntry.find({ userId })
      .sort({ entryDate: -1 })
      .select('entryDate mood wordCount')
      .lean();
    
    // Calculate total words
    let totalWords = 0;
    
    // Calculate most common mood
    const moodCounts = {};
    let maxMoodCount = 0;
    let mostCommonMood = { label: 'neutral', score: 5 };
    
    // Process entry data
    entries.forEach(entry => {
      // Add to total words
      totalWords += entry.wordCount || 0;
      
      // Count moods
      const moodLabel = entry.mood?.label || 'neutral';
      if (!moodCounts[moodLabel]) {
        moodCounts[moodLabel] = {
          count: 1,
          score: entry.mood?.score || 5
        };
      } else {
        moodCounts[moodLabel].count += 1;
      }
      
      // Update most common mood if needed
      if (moodCounts[moodLabel].count > maxMoodCount) {
        maxMoodCount = moodCounts[moodLabel].count;
        mostCommonMood = {
          label: moodLabel,
          score: moodCounts[moodLabel].score
        };
      }
    });
    
    // Calculate average words per entry
    const avgWordsPerEntry = totalEntries > 0 
      ? Math.round(totalWords / totalEntries) 
      : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    let streakActive = false;
      // Convert entries to dates only, ensuring unique dates and sorted descending
    const entryDates = Array.from(new Set(
      entries.map(entry => dayjs(entry.entryDate).startOf('day').toISOString())
    )).map(dateStr => dayjs(dateStr)).sort((a, b) => b.diff(a));
    
    // Check for today's entry
    if (entryDates.length > 0) {
      const today = dayjs().startOf('day');
      const latestEntry = entryDates[0];
      
      // If latest entry is today, streak is active
      const dayDiff = today.diff(latestEntry, 'day');
      streakActive = dayDiff <= 0; // Today's entry exists
      
      if (streakActive) {
        // Start counting the streak
        currentStreak = 1;
        
        // Check consecutive days
        for (let i = 1; i < entryDates.length; i++) {
          const expectedDate = dayjs().startOf('day').subtract(i, 'day');
          const entryDate = entryDates[i];
          
          if (expectedDate.diff(entryDate, 'day') === 0) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
      // Calculate longest streak
    let longestStreak = currentStreak;
    let tempStreak = 0;
    
    // Only calculate if there are multiple entries
    if (entryDates.length > 1) {
      for (let i = 0; i < entryDates.length - 1; i++) {
        const currDate = entryDates[i];
        const nextDate = entryDates[i + 1];
        
        // Check if entries are consecutive days
        const dayDiff = currDate.diff(nextDate, 'day');
        
        if (dayDiff === 1) {
          tempStreak = tempStreak === 0 ? 2 : tempStreak + 1;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
    }
      // For new users with no entries, provide default values
    const defaultMood = { label: 'neutral', score: 5 };
    
    // Return all stats
    return res.status(200).json({
      totalEntries,
      currentStreak,
      longestStreak,
      totalWords,
      avgWordsPerEntry,
      mostCommonMood: totalEntries > 0 ? mostCommonMood : defaultMood,
      moodCounts: totalEntries > 0 ? moodCounts : { neutral: { count: 0, score: 5 } },
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    return res.status(500).json({ error: 'Failed to fetch journal statistics' });
  }
};

export default connectToMongo(handler);
