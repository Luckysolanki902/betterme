// components/CategoriesChart.js
import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  alpha,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import CategoryIcon from '@mui/icons-material/Category';
import { motion } from 'framer-motion';

const CategoriesChart = ({ data, animationDelay = 0 }) => {
  const theme = useTheme();
  
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    '#009688', // teal
    '#ff5722', // deep orange
    '#9c27b0', // purple
    '#3f51b5', // indigo
    '#f44336', // red
    '#4caf50', // green
  ];
  
  // Custom tooltip to show category name and completion count
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
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
          <Typography fontWeight={600} color="textPrimary">
            {payload[0].name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`${payload[0].value} completed (${payload[0].payload.percentage}%)`}
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
          <CategoryIcon sx={{ color: theme.palette.primary.main }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Categories Breakdown
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 300, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              innerRadius={60}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => <span style={{ fontSize: '0.75rem', color: theme.palette.text.primary }}>{value}</span>}
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default CategoriesChart;
