// components/CategorySelector.js
import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Chip,
  OutlinedInput,
  useTheme,
  alpha
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';

const CategorySelector = ({ categories, selectedCategory, onChange }) => {
  const theme = useTheme();
  
  // Get category color based on name (consistent coloring)
  const getCategoryColor = (name) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      '#009688', // teal
      '#ff5722', // deep orange
      '#9c27b0', // purple
      '#3f51b5', // indigo
      '#f44336', // red
      '#4caf50', // green
    ];
    
    // Generate a consistent index based on the name
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <FormControl 
        fullWidth
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            transition: 'all 0.2s',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            '&.Mui-focused': {
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.12)}`,
            }
          }
        }}
      >
        <InputLabel id="category-select-label">
          Select Category
        </InputLabel>
        <Select
          labelId="category-select-label"
          id="category-select"
          value={selectedCategory}
          onChange={onChange}
          input={<OutlinedInput label="Select Category" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon sx={{ fontSize: 20 }} />
              {selected === 'all' ? 'All Categories' : (
                <Chip 
                  label={selected} 
                  size="small" 
                  sx={{ 
                    fontWeight: 600,
                    backgroundColor: getCategoryColor(selected),
                    color: '#fff' 
                  }} 
                />
              )}
            </Box>
          )}
        >
          <MenuItem value="all">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              <Chip 
                label={category} 
                size="small" 
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: getCategoryColor(category),
                  color: '#fff' 
                }} 
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CategorySelector;
