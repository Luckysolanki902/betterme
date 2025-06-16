// components/journal/JournalStats.js
import React from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import CountUp from 'react-countup';
import styles from './JournalStyles.module.css';
import MoodDisplay from './MoodDisplay';

// Stats card for journal metrics
const StatCard = ({ value, label, color }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0}
      className={styles.statCard}
      sx={{ 
        backgroundColor: alpha(color, 0.05),
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Typography variant="body2" className={styles.statLabel}>
        {label}
      </Typography>
      <Typography variant="h4" className={styles.statValue} sx={{ color }}>
        <CountUp end={value} duration={2} />
      </Typography>
    </Paper>
  );
};

// Journal statistics component
const JournalStats = ({ stats }) => {
  const theme = useTheme();
  // Ensure stats has default values and is not undefined
  const safeStats = stats || {};
  const {
    totalEntries = 0,
    currentStreak = 0,
    longestStreak = 0,
    totalWords = 0,
    avgWordsPerEntry = 0,
    mostCommonMood = { label: 'neutral', score: 5 },
    moodCounts = { neutral: { count: 0, score: 5 } }
  } = safeStats;
  
  // Get mood color based on mood score
  const getMoodColor = (score) => {
    if (score >= 8) return theme.palette.success.main; // Happy/Excited
    if (score >= 6) return theme.palette.info.main; // Positive
    if (score >= 4) return theme.palette.warning.main; // Neutral
    return theme.palette.error.main; // Negative
  };

  return (
    <Box className={styles.statsContainer}>
      <StatCard 
        value={totalEntries} 
        label="Total Entries" 
        color={theme.palette.primary.main}
      />
      
      <StatCard 
        value={currentStreak} 
        label="Current Streak (Days)" 
        color={theme.palette.secondary.main}
      />
      
      <StatCard 
        value={longestStreak} 
        label="Longest Streak (Days)" 
        color={theme.palette.success.main}
      />
      
      <StatCard 
        value={totalWords} 
        label="Total Words Written" 
        color={theme.palette.info.main}
      />
      
      <StatCard 
        value={avgWordsPerEntry} 
        label="Avg. Words Per Entry" 
        color={theme.palette.warning.main}
      />
        <Paper 
        elevation={0}
        className={styles.statCard}
        sx={{ 
          backgroundColor: alpha(getMoodColor(mostCommonMood.score), 0.05),
          borderLeft: `4px solid ${getMoodColor(mostCommonMood.score)}`,
        }}
      >
        <Typography variant="body2" className={styles.statLabel}>
          Most Common Mood
        </Typography>
        <Box sx={{ my: 1, display: 'flex', justifyContent: 'center' }}>
          <MoodDisplay mood={mostCommonMood} size="large" />
        </Box>        <Typography variant="body1" sx={{ color: getMoodColor(mostCommonMood.score), textAlign: 'center' }}>
          {mostCommonMood.label.charAt(0).toUpperCase() + mostCommonMood.label.slice(1)}
        </Typography>      </Paper>
      
      {/* Mood Distribution Section */}
      {totalEntries > 0 && (
        <Paper 
          elevation={0}
          className={styles.statCard}
          sx={{ 
            backgroundColor: alpha(theme.palette.primary.light, 0.05),
            borderLeft: `4px solid ${theme.palette.primary.light}`,
            gridColumn: '1 / -1',
            padding: 2,
            width: '100%',
          }}
        >
          <Typography variant="body2" className={styles.statLabel}>
            Mood Distribution
          </Typography>
            <Box className={styles.moodDistribution}>            {Object.entries(moodCounts).map(([moodName, data]) => {
              // Ensure data has valid score and count properties
              const safeData = {
                score: (data && typeof data.score === 'number' && !isNaN(data.score)) ? data.score : 5,
                count: (data && typeof data.count === 'number' && !isNaN(data.count)) ? data.count : 0
              };
              
              return (
                <Box 
                  key={moodName}
                  className={styles.moodItem}
                >
                  <MoodDisplay 
                    mood={{ label: moodName, score: safeData.score }} 
                    size="small"
                  />
                  <Typography variant="caption" sx={{ mt: 1 }}>
                    {moodName}
                  </Typography>
                  <Typography className={styles.moodCount}>
                    {safeData.count}
                  </Typography>
                  {totalEntries > 0 && (
                    <Typography className={styles.moodPercentage}>
                      {Math.round((safeData.count / totalEntries) * 100)}%
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

// Helper to get emoji for mood
const getMoodEmoji = (mood) => {
  switch (mood.toLowerCase()) {
    case 'happy': return '😊';
    case 'calm': return '😌';
    case 'excited': return '😄';
    case 'neutral': return '😐';
    case 'sad': return '😔';
    case 'angry': return '😠';
    case 'anxious': return '😰';
    case 'tired': return '😴';
    default: return '😐';
  }
};

export default JournalStats;
