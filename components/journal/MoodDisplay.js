// components/journal/MoodDisplay.js
import React from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import styles from './MoodDisplay.module.css';
import { MOOD_OPTIONS, DEFAULT_MOOD, getMoodByLabel } from '@/utils/moods';

// Get a color based on mood score
const getMoodColor = (score, theme) => {
  if (score >= 8) return theme.palette.success.main; // Happy/Excited
  if (score >= 6) return theme.palette.info.main; // Positive
  if (score >= 4) return theme.palette.warning.main; // Neutral
  if (score >= 2) return theme.palette.error.light; // Slightly negative
  return theme.palette.error.main; // Very negative
};

// Component to display the mood emoji with tooltip
const MoodDisplay = ({ 
  mood, 
  size = 'medium', 
  showLabel = true, 
  tooltipText = "Click to update mood", 
  updating = false 
}) => {
  const theme = useTheme();
  
  // Handle missing mood data gracefully
  let safeMood = { ...DEFAULT_MOOD };
  
  if (mood) {
    if (typeof mood === 'string') {
      // If mood is just a string label, find the corresponding mood object
      safeMood = getMoodByLabel(mood) || DEFAULT_MOOD;
    } else if (typeof mood === 'object') {
      // Ensure mood has valid properties
      const label = (typeof mood.label === 'string') ? mood.label.toLowerCase() : DEFAULT_MOOD.label;
      const score = (typeof mood.score === 'number' && !isNaN(mood.score)) ? mood.score : DEFAULT_MOOD.score;
      
      // Get full mood from label or use as is if it has emoji
      if (mood.emoji) {
        safeMood = {
          label,
          score,
          emoji: mood.emoji
        };
      } else {
        // Try to find matching mood in our options
        const foundMood = getMoodByLabel(label);
        safeMood = foundMood || { ...DEFAULT_MOOD, label, score };
      }
      
      // Ensure score is within valid range
      if (safeMood.score < 1) safeMood.score = 1;
      if (safeMood.score > 10) safeMood.score = 10;
    }
  }
  
  const emoji = safeMood.emoji || DEFAULT_MOOD.emoji;
  const moodColor = getMoodColor(safeMood.score, theme);
  
  // Calculate size in pixels
  const sizeMap = {
    small: 24,
    medium: 36,
    large: 48
  };
  const emojiSize = sizeMap[size] || sizeMap.medium;
    return (
    <Tooltip title={tooltipText} arrow>
      <Box className={styles.moodDisplay} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box 
          className={`${styles.moodEmoji} ${updating ? styles.updating : ''}`}
          sx={{
            width: emojiSize,
            height: emojiSize,
            fontSize: emojiSize * 0.6,
            background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
            border: `2px solid ${moodColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            '&::after': updating ? {
              content: '""',
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              border: `2px solid ${moodColor}`,
              borderRadius: '50%',
              animation: 'pulse 1.5s infinite',
              opacity: 0.6
            } : {}
          }}
        >
          {emoji}
        </Box>
        
        {showLabel && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: moodColor,
              fontWeight: 500,
              textTransform: 'capitalize',
              transition: 'color 0.3s ease'
            }}
          >
            {safeMood.label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

export default MoodDisplay;
