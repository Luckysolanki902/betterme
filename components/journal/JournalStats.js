// components/journal/JournalStats.js
import React from 'react';
import { Box, Typography, Grid, Paper, useTheme, alpha } from '@mui/material';
import MoodDisplay from './MoodDisplay';

const JournalStats = ({ stats }) => {
  const theme = useTheme();
  
  // Get background color based on streak
  const getStreakColor = (streak) => {
    if (streak >= 7) return theme.palette.success.main;
    if (streak >= 3) return theme.palette.info.main;
    return theme.palette.primary.main;
  };
  
  const streakColor = getStreakColor(stats.currentStreak);
  
  return (
    <Grid container spacing={3}>
      {/* Current Stats Section */}
      <Grid item xs={12} md={6}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Current Stats
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(streakColor, 0.3)}`,
                  background: alpha(streakColor, 0.05),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Streak
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="h5" 
                      fontWeight="bold"
                      sx={{ color: streakColor }}
                    >
                      {stats.currentStreak}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                      {stats.currentStreak === 1 ? 'day' : 'days'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Longest Streak
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {stats.longestStreak}
                  <Typography component="span" variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
                    days
                  </Typography>
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Avg. Words per Entry
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {stats.avgWordsPerEntry}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      
      {/* Mood Section */}
      <Grid item xs={12} md={6}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Mood Analysis
          </Typography>
          
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
              height: '100%'
            }}
          >
            {stats.totalEntries > 0 ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                    Most Common Mood:
                  </Typography>
                  <MoodDisplay mood={stats.mostCommonMood} size="medium" />
                </Box>
                
                <Box sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: 2
                }}>
                  {Object.entries(stats.moodCounts || {}).slice(0, 5).map(([label, data]) => (
                    <Box 
                      key={label}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {data.count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Start journaling to track your mood patterns
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
};

export default JournalStats;
