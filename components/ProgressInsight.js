// components/ProgressInsight.js
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  alpha,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { motion } from 'framer-motion';

const ProgressInsight = ({ insights, period = "today", animationDelay = 0 }) => {
  const theme = useTheme();
  
  // Generate motivational message based on completion percentage
  const getMotivationalMessage = (percentage) => {
    if (percentage >= 90) return "Outstanding effort! You're crushing it today!";
    if (percentage >= 75) return "Great work! You're making excellent progress!";
    if (percentage >= 50) return "Good job! Keep pushing to finish strong!";
    if (percentage >= 25) return "You've started well! Keep going!";
    return "Every small step counts! You can do this!";
  };
  
  const periodText = period === "today" ? "Today" : 
                    period === "week" ? "This Week" : "This Month";
  
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
          background: 'linear-gradient(to right, #4263EB, #9370DB)',
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
            backgroundColor: alpha(theme.palette.primary.main, 0.1)
          }}
        >
          <TipsAndUpdatesIcon sx={{ color: theme.palette.primary.main }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          {periodText} Insights
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(to right, #4263EB, #9370DB)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {getMotivationalMessage(insights.completionPercentage)}
        </Typography>
        
        <Chip 
          icon={<BoltIcon />} 
          label={`${insights.completionPercentage}% Completed`} 
          color="primary" 
          variant="outlined"
          sx={{ fontWeight: 600, my: 1 }}
        />
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <List sx={{ py: 0 }}>
        <ListItem sx={{ px: 0, py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CheckCircleIcon color="success" fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary={`${insights.completedTasks} tasks completed`} 
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItem>
        
        <ListItem sx={{ px: 0, py: 0.5 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CheckCircleIcon sx={{ color: theme.palette.info.main }} fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary={`Most productive category: ${insights.topCategory}`} 
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </ListItem>
        
        {insights.streak > 0 && (
          <ListItem sx={{ px: 0, py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <BoltIcon sx={{ color: '#FF9800' }} fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary={`${insights.streak} day streak!`} 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItem>
        )}
      </List>
      
      {insights.nextMilestone && (
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Next milestone:
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {insights.nextMilestone}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ProgressInsight;
