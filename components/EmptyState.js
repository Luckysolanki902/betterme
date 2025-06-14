import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import AddTaskRoundedIcon from '@mui/icons-material/AddTaskRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const EmptyState = ({ title, description, actionText, actionPath, actionHandler, icon, type }) => {
  const router = useRouter();
  const theme = useTheme();
  
  // Choose icon based on path, type or use the provided icon
  const getIcon = () => {
    if (icon) return icon;
    
    if (actionPath === '/modify' || type === 'todos') {
      return <AddTaskRoundedIcon sx={{ fontSize: 24 }} />;
    } else if (actionPath?.includes('progress')) {
      return <ShowChartRoundedIcon sx={{ fontSize: 24 }} />;
    } else if (actionPath?.includes('settings')) {
      return <SettingsRoundedIcon sx={{ fontSize: 24 }} />;
    }
    
    return <AddTaskRoundedIcon sx={{ fontSize: 24 }} />;
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          color: theme.palette.text.secondary
        }}
      >
        {getIcon()}
      </Box>
      
      <Typography 
        variant="body1" 
        component="h3" 
        sx={{ 
          fontWeight: 500,
          mb: 1,
          color: theme.palette.text.primary
        }}
      >
        {title || 'No Content Yet'}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          mb: 3,
          maxWidth: '250px'
        }}
      >
        {description || 'Start adding content to see it appear here'}
      </Typography>
        {actionText && (actionPath || actionHandler) && (
        <Button
          component={motion.button}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          variant="outlined"
          size="small"
          onClick={() => actionHandler ? actionHandler() : router.push(actionPath)}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 2,
            px: 2.5,
            py: 0.75,
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover': {
              borderColor: theme.palette.primary.dark,
              backgroundColor: 'rgba(66, 99, 235, 0.04)',
            }
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
