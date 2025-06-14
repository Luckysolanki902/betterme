// components/DailyProgressCard.js
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  LinearProgress, 
  Chip,
  useTheme, 
  alpha
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const DailyProgressCard = ({ data, animationDelay = 0 }) => {
  const theme = useTheme();
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d');
  
  // Calculate completion percentage
  const completionPercentage = data?.completedTasks > 0 && data?.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0;
  
  // Get color based on percentage
  const getStatusColor = () => {
    if (completionPercentage >= 80) return theme.palette.success.main;
    if (completionPercentage >= 50) return theme.palette.info.main;
    if (completionPercentage >= 25) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  return (
    <Paper
      component={motion.div}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.1)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 6px 24px ${alpha(theme.palette.divider, 0.2)}`,
          transform: 'translateY(-5px)'
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: '4px',
          background: getStatusColor()
        }} 
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              mr: 1.5,
              p: 1, 
              borderRadius: '50%',
              backgroundColor: alpha(getStatusColor(), 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AccessTimeIcon sx={{ color: getStatusColor() }} />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            Daily Progress
          </Typography>
        </Box>
        
        <Chip 
          label={formattedDate}
          size="small"
          sx={{ 
            fontWeight: 600,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main
          }}
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Completion
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {data?.completedTasks || 0}/{data?.totalTasks || 0} tasks
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={completionPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(getStatusColor(), 0.2),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: getStatusColor(),
            }
          }}
        />
      </Box>
      
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography 
          variant="h3" 
          component="div" 
          fontWeight={700}
          sx={{ 
            color: getStatusColor(),
            mb: 1
          }}
        >
          {completionPercentage}%
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {getCompletionMessage(completionPercentage)}
        </Typography>
      </Box>
    </Paper>
  );
};

// Helper function to generate encouraging message based on completion percentage
function getCompletionMessage(percentage) {
  if (percentage >= 90) return "Amazing work today! You're crushing it!";
  if (percentage >= 75) return "Great progress! Keep the momentum going!";
  if (percentage >= 50) return "Good job! You're halfway there!";
  if (percentage >= 25) return "You've made a start! Keep pushing forward!";
  return "Every journey begins with a single step!";
}

export default DailyProgressCard;
