// components/journal/MoodDisplay.js
import React from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import styles from './MoodDisplay.module.css';

// Map of mood labels to emoji representations
const MOOD_EMOJIS = {
  'happy': '😊',
  'calm': '😌',
  'excited': '😄',
  'neutral': '😐',
  'sad': '😔',
  'angry': '😠',
  'anxious': '😰',
  'tired': '😴'
};

// Get a color based on mood score
const getMoodColor = (score, theme) => {
  if (score >= 8) return theme.palette.success.main; // Happy/Excited
  if (score >= 6) return theme.palette.info.main; // Positive
  if (score >= 4) return theme.palette.warning.main; // Neutral
  return theme.palette.error.main; // Negative
};

// Component to display the mood emoji with tooltip
const MoodDisplay = ({ mood, size = 'medium', showLabel = false }) => {
  const theme = useTheme();
    // Handle missing mood data gracefully
  let safeMood = { label: 'neutral', score: 5 };
  
  if (mood) {
    // Ensure mood has valid properties
    safeMood = {
      label: (typeof mood.label === 'string') ? mood.label.toLowerCase() : 'neutral',
      score: (typeof mood.score === 'number' && !isNaN(mood.score)) ? mood.score : 5
    };
    
    // Validate that label is one of our known moods
    if (!MOOD_EMOJIS[safeMood.label]) {
      safeMood.label = 'neutral';
    }
    
    // Ensure score is within valid range
    if (safeMood.score < 1) safeMood.score = 1;
    if (safeMood.score > 10) safeMood.score = 10;
  }
  
  const emoji = MOOD_EMOJIS[safeMood.label] || '😐';
  const moodColor = getMoodColor(safeMood.score, theme);
  
  // Calculate size in pixels
  const sizeMap = {
    small: 24,
    medium: 36,
    large: 48
  };
  const emojiSize = sizeMap[size] || sizeMap.medium;    return (
    <Tooltip title={`Mood: ${safeMood.label}`} arrow>
      <Box className={styles.moodDisplay}>
        <Box 
          className={styles.moodEmoji}
          sx={{
            width: emojiSize,
            height: emojiSize,
            fontSize: emojiSize * 0.6,
            background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
            border: `2px solid ${moodColor}`,
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
              textTransform: 'capitalize'
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
