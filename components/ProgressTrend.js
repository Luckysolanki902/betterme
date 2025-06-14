// components/ProgressTrend.js
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  alpha,
} from '@mui/material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const ProgressTrend = ({ data, period = 'week', animationDelay = 0 }) => {
  const theme = useTheme();
  
  // Format X-axis labels based on period
  const formatXAxis = (tickItem) => {
    const date = parseISO(tickItem);
    if (period === 'month') {
      return format(date, 'MMM d');
    } else if (period === 'week') {
      return format(date, 'EEE');
    } else {
      return format(date, 'ha'); // For day view, show hours
    }
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = parseISO(label);
      const formattedDate = format(date, 'MMM d, yyyy');
      const percentage = payload[0].value;
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="subtitle2">
            {formattedDate}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Completion: <strong>{percentage}%</strong>
          </Typography>
        </Box>
      );
    }
    return null;
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
          <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          {period === 'month' ? 'Monthly' : period === 'week' ? 'Weekly' : 'Daily'} Progress Trend
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 300, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 12 }} 
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }} 
              domain={[0, 100]} 
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="percentage" 
              stroke={theme.palette.primary.main} 
              fillOpacity={1} 
              fill="url(#colorProgress)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProgressTrend;
