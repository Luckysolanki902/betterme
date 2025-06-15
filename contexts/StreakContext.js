// contexts/StreakContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentDayNumber, calculateStreak, getAdjustedDateString } from '@/utils/streakUtils';
import { useStartDate } from './StartDateContext';

const StreakContext = createContext();

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};

export const StreakProvider = ({ children }) => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    dayCount: 1,
    streakStartDate: null,
    isLoading: true
  });
  
  const startDate = useStartDate();

  const fetchStreakData = async () => {
    if (!startDate) return;
    
    try {
      setStreakData(prev => ({ ...prev, isLoading: true }));
      
      // Get completion history for streak calculation
      const res = await fetch('/api/completion-history');
      const completionHistory = await res.json();
      
      // Calculate current day number
      const dayCount = getCurrentDayNumber(startDate);
      
      // Calculate streak information
      const streakInfo = calculateStreak(completionHistory, startDate);
      
      setStreakData({
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        dayCount,
        streakStartDate: streakInfo.streakStartDate,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching streak data:', error);
      setStreakData(prev => ({ 
        ...prev, 
        isLoading: false,
        dayCount: getCurrentDayNumber(startDate)
      }));
    }
  };

  const updateStreak = () => {
    fetchStreakData();
  };

  useEffect(() => {
    if (startDate) {
      fetchStreakData();
    }
  }, [startDate]);

  const value = {
    ...streakData,
    updateStreak,
    refreshStreak: fetchStreakData
  };

  return (
    <StreakContext.Provider value={value}>
      {children}
    </StreakContext.Provider>
  );
};
