// utils/streakUtils.js
import { startOfDay, addDays, format, differenceInDays } from 'date-fns';

/**
 * Get the start of day adjusted for 4:00 AM local timezone
 * Days start at 4:00 AM local time instead of midnight
 */
export const getAdjustedStartOfDay = (date = new Date()) => {
  const adjustedDate = new Date(date);
  
  // If current time is before 4:00 AM, consider it as previous day
  if (adjustedDate.getHours() < 4) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  
  // Set to 4:00 AM of the determined day
  adjustedDate.setHours(4, 0, 0, 0);
  return adjustedDate;
};

/**
 * Get the current day number based on start date and 4:00 AM logic
 */
export const getCurrentDayNumber = (startDate) => {
  if (!startDate) return 1;
  
  const start = getAdjustedStartOfDay(new Date(startDate));
  const today = getAdjustedStartOfDay(new Date());
  
  return Math.max(1, differenceInDays(today, start) + 1);
};

/**
 * Format date for API calls (YYYY-MM-DD) based on 4:00 AM logic
 */
export const getAdjustedDateString = (date = new Date()) => {
  const adjustedDate = getAdjustedStartOfDay(date);
  return format(adjustedDate, 'yyyy-MM-dd');
};

/**
 * Check if a date is today based on 4:00 AM logic
 */
export const isToday = (date) => {
  const today = getAdjustedStartOfDay(new Date());
  const compareDate = getAdjustedStartOfDay(new Date(date));
  return today.getTime() === compareDate.getTime();
};

/**
 * Get streak data for a user based on completion history
 */
export const calculateStreak = (completionHistory, startDate) => {
  if (!completionHistory || completionHistory.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakStartDate: null
    };
  }

  // Sort completion history by date
  const sortedHistory = completionHistory
    .map(entry => ({
      ...entry,
      adjustedDate: getAdjustedStartOfDay(new Date(entry.date))
    }))
    .sort((a, b) => b.adjustedDate - a.adjustedDate);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let streakStartDate = null;
  
  const today = getAdjustedStartOfDay(new Date());
  let currentDate = new Date(today);

  // Calculate current streak (working backwards from today)
  for (let i = 0; i < sortedHistory.length; i++) {
    const entry = sortedHistory[i];
    const entryDate = entry.adjustedDate;
    
    if (entryDate.getTime() === currentDate.getTime()) {
      if (entry.completed) {
        currentStreak++;
        if (currentStreak === 1) {
          streakStartDate = entryDate;
        }
      } else {
        break; // Streak broken
      }
      currentDate = addDays(currentDate, -1);
    } else {
      break; // Gap in history
    }
  }

  // Calculate longest streak
  tempStreak = 0;
  for (const entry of sortedHistory) {
    if (entry.completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakStartDate
  };
};

/**
 * Get time until next day (4:00 AM)
 */
export const getTimeUntilNextDay = () => {
  const now = new Date();
  const nextDay = new Date(now);
  
  if (now.getHours() >= 4) {
    // Next day is tomorrow at 4:00 AM
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  nextDay.setHours(4, 0, 0, 0);
  
  const diff = nextDay.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, totalMilliseconds: diff };
};
