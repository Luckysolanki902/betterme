// components/TotalCompletion.js
import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';

const TotalCompletion = ({ 
  totalScore = 0, 
  totalPossibleScore = 0, 
  improvement = 0, 
  isLoading 
}) => {
  const improvementPercentage = parseFloat(improvement) || 0;
  const formattedImprovement = improvementPercentage === 0 ? '0' : improvementPercentage.toFixed(1);
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        p: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        borderRadius: '8px',
        background: theme.palette.background.paper
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Overall Progress
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total Score:
        </Typography>
        <Typography variant="body1" fontWeight={500}>
          {isLoading ? '–' : totalScore} / {isLoading ? '–' : totalPossibleScore}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Improvement:
        </Typography>
        <Typography 
          variant="body1" 
          fontWeight={500} 
          color={improvementPercentage > 0 ? 'success.main' : 'text.primary'}
        >
          {formattedImprovement}%
        </Typography>
      </Box>
    </Box>
  );
};

export default TotalCompletion;
