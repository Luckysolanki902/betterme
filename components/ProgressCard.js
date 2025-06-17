// components/ProgressCard.js
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  useTheme, 
  alpha,
  LinearProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { motion } from 'framer-motion';

const ProgressCard = ({ 
  title, 
  value, 
  maxValue, 
  icon, 
  color,
  animationDelay = 0,
  progressType = "circular" // circular or linear
}) => {
  const theme = useTheme();
  const percentage = Math.round((value / maxValue) * 100) || 0;
  console.log(value, maxValue, percentage);
  // Get color based on completion percentage
  const getColorBasedOnProgress = () => {
    if (percentage >= 80) return theme.palette.success.main;
    if (percentage >= 60) return '#8BC34A'; // light-green
    if (percentage >= 40) return '#FFC107'; // amber
    if (percentage >= 20) return '#FF9800'; // orange
    return '#F44336'; // red
  };
  
  const progressColor = color || getColorBasedOnProgress();
  
  return (
    <Paper
      component={motion.div}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 3,
        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.1)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: progressColor,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box 
          sx={{ 
            mr: 1.5, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: alpha(progressColor, 0.1)
          }}
        >
          {icon || <TrendingUpIcon sx={{ color: progressColor }} />}
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        {progressType === 'circular' ? (
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={120}
              thickness={5}
              sx={{
                color: progressColor,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h4"
                component="div"
                sx={{ fontWeight: 700 }}
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {value}/{maxValue}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 8,
                borderRadius: 5,
                backgroundColor: alpha(progressColor, 0.2),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundColor: progressColor,
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{ 
                  fontWeight: 700,
                  color: progressColor
                }}
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ProgressCard;
