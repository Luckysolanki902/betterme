// components/ProgressTabs.js
import React, { useState } from 'react';
import { Tabs, Tab, Box, useTheme, alpha } from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import { motion } from 'framer-motion';

const ProgressTabs = ({ value, onChange }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        width: '100%', 
        borderRadius: 2,
        mb: 3,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
        aria-label="progress time periods"
        sx={{
          '& .MuiTab-root': {
            py: 2,
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            fontWeight: 600,
            transition: 'all 0.3s',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 700,
              '& .MuiSvgIcon-root': {
                color: theme.palette.primary.main,
              }
            },
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          }
        }}
      >
        <Tab 
          icon={<TodayIcon />} 
          label="Today" 
          iconPosition="start" 
          disableRipple
        />
        <Tab 
          icon={<ViewWeekIcon />} 
          label="Weekly" 
          iconPosition="start" 
          disableRipple
        />
        <Tab 
          icon={<CalendarViewMonthIcon />} 
          label="Monthly" 
          iconPosition="start" 
          disableRipple
        />
      </Tabs>
    </Box>
  );
}

export default ProgressTabs;
