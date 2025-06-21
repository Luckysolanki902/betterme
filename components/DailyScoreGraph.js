// components/DailyScoreGraph.js
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  alpha,
  useMediaQuery,
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const DailyScoreGraph = ({ data, period = 'week', animationDelay = 0 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
  
  // Custom tooltip for the graph
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = parseISO(label);
      const formattedDate = format(date, 'MMM d, yyyy');
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="subtitle2">
            {formattedDate}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color, mt: 0.5 }}>
              {entry.name}: <strong>{entry.value}</strong> points
            </Typography>
          ))}
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
      transition={{ duration: 0.5, delay: animationDelay }}
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        height: { xs: '350px', sm: '400px', md: '450px' },
        borderRadius: 3,
        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.15)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${theme.palette.background.paper} 100%)`,
        backdropFilter: 'blur(10px)',
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
        <Box 
          sx={{ 
            mr: { xs: 1, sm: 1.5 }, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
            boxShadow: '0 4px 12px rgba(66, 99, 235, 0.3)'
          }}
        >
          <EqualizerIcon sx={{ 
            color: 'white', 
            fontSize: { xs: 16, sm: 20 } 
          }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            background: 'linear-gradient(to right, #4263EB, #9370DB)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Daily Score Progress
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 300, margin: '0 auto', mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 12 }} 
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="score" 
              name="Score"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: theme.palette.background.paper }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalPossible" 
              name="Total Possible"
              stroke={theme.palette.secondary.main} 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, strokeWidth: 1, fill: theme.palette.background.paper }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default DailyScoreGraph;
