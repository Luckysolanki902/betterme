// components/EmptyState.js
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  AddTaskRounded as AddTaskRoundedIcon,
  ShowChartRounded as ShowChartRoundedIcon,
  SettingsRounded as SettingsRoundedIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';

const EmptyState = ({ 
  title = "No tasks yet!", 
  description = "Create your first task to start building better habits and tracking your daily progress",
  actionText = "Create Your First Task",
  onAction,
  actionPath,
  actionHandler,
  icon,
  type,
  showStats = false 
}) => {
  const theme = useTheme();
  const router = useRouter();

  // Choose icon based on path, type or use the provided icon
  const getIcon = () => {
    if (icon) return icon;
    
    if (actionPath === '/modify' || type === 'todos') {
      return AddTaskRoundedIcon;
    } else if (actionPath?.includes('progress')) {
      return ShowChartRoundedIcon;
    } else if (actionPath?.includes('settings')) {
      return SettingsRoundedIcon;
    }
    
    return AssignmentIcon;
  };

  const IconComponent = getIcon();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionHandler) {
      actionHandler();
    } else if (actionPath) {
      router.push(actionPath);
    }
  };

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 6, sm: 8 },
        px: 4,
        background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
      }}
    >
      {/* Animated Icon */}
      <Box
        component={motion.div}
        animate={{ 
          y: [-5, 5],
          scale: [1, 1.05]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        sx={{ mb: 3 }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <IconComponent 
            sx={{ 
              fontSize: 60,
              color: theme.palette.primary.main,
              opacity: 0.7
            }} 
          />
        </Box>
      </Box>

      {/* Title */}
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          mb: 2,
          color: theme.palette.text.primary
        }}
      >
        {title}
      </Typography>

      {/* Description */}
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: 4, 
          maxWidth: 500, 
          mx: 'auto',
          lineHeight: 1.6
        }}
      >
        {description}
      </Typography>

      {/* Action Button */}
      {(onAction || actionHandler || actionPath) && (
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleAction}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: '0 8px 20px rgba(66, 99, 235, 0.3)',
            background: 'linear-gradient(45deg, #4263EB 30%, #5C7CFA 90%)',
            '&:hover': {
              boxShadow: '0 12px 25px rgba(66, 99, 235, 0.4)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {actionText}
        </Button>
      )}

      {/* Optional Stats/Tips */}
      {showStats && (
        <Box sx={{ mt: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <LightbulbIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                Pro Tip
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Start with 3-5 simple tasks. Label them easy, medium, or hard to track your progress effectively.
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default EmptyState;
      