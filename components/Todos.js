// components/Todos.js
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  alpha,
  useTheme,
  Chip,
  Button,
  Tooltip,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { motion, AnimatePresence } from 'framer-motion';

const Todos = ({ todos, completedTodos, onTodoToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [toggledTodoId, setToggledTodoId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const theme = useTheme();
  
  // Get unique categories for filtering
  const uniqueCategories = ['all', ...new Set(todos.map(todo => todo.category).filter(Boolean))];
    // Calculate scores with null checks
  const totalScore = todos?.reduce((acc, todo) => {
    // Ensure todo and score are valid
    if (!todo || typeof todo.score !== 'number') return acc;
    return acc + todo.score;
  }, 0) || 0;
  
  const completedScore = todos
    ?.filter(todo => todo && todo._id && completedTodos?.includes(todo._id))
    .reduce((acc, todo) => {
      // Ensure todo and score are valid
      if (!todo || typeof todo.score !== 'number') return acc;
      return acc + todo.score;
    }, 0) || 0;
    
  const scorePercentage = totalScore > 0 ? Math.round((completedScore / totalScore) * 100) : 0;
    // Filter todos based on search and category
  const filteredTodos = todos?.filter(todo => {
    // Defensive check to ensure todo has required properties
    if (!todo || !todo.title) {
      console.warn('Invalid todo object:', todo);
      return false;
    }
    
    const matchesSearch = 
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.category && todo.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || todo.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
        position: 'relative',
        background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
        backdropFilter: 'blur(10px)',
      }}
    >      {/* Header with search and score */}
      <Box 
        sx={{ 
          p: { xs: 1.5, sm: 2.5 }, 
          background: `white`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          position: 'sticky',
          top: 0,
          zIndex: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 2 },
        }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={handleSearch}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: alpha(theme.palette.background.default, 0.6),
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: alpha(theme.palette.divider, 0.2),
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.5)
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.95rem',
                  padding: '14px 14px',
                  fontWeight: 500
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" fontSize="small" sx={{ opacity: 0.7 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={clearSearch} sx={{ color: theme.palette.primary.main }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Score Progress */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pl: { xs: 0, sm: 2 },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-start' }
            }}
          >
  
        
          </Box>
        </Box>

      {/* Category filters */}
      {uniqueCategories.length > 1 && (
        <Box 
          sx={{ 
            display: 'flex', 
            overflowX: 'auto', 
            py: 1.5, 
            px: 2.5,
            gap: 1,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            '&::-webkit-scrollbar': { height: 0 }
          }}
        >
          {uniqueCategories.map((category) => (
            <Chip
              key={category}
              label={category === 'all' ? 'All Tasks' : category}
              onClick={() => handleCategoryChange(category)}
              color={activeCategory === category ? 'primary' : 'default'}
              variant={activeCategory === category ? 'filled' : 'outlined'}
              sx={{
                borderRadius: '8px',
                px: 0.5,
                fontWeight: 600,
                fontSize: '0.75rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
                },
                ...(activeCategory === category && {
                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.25)}`
                })
              }}
              icon={activeCategory === category && category === 'all' ? <FilterListIcon fontSize="small" /> : undefined}
            />
          ))}
        </Box>
      )}
          {/* Todos List */}      <List 
        component={motion.div} 
        layout 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        disablePadding 
        sx={{ p: 2 }}
      >        
        <AnimatePresence mode="popLayout">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo, index) => {
            const isCompleted = completedTodos.includes(todo._id);
            
            return (
              <ListItem
                key={todo._id}
                disablePadding
                component={motion.div}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                sx={{
                  py: 0.8,
                  display: 'block',
                }}
              >                <Box 
                  component={motion.div}                  animate={isCompleted ? { 
                    opacity: [0.8, 1],
                  } : {}}
                  transition={{ duration: 0.5 }}sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    background: isCompleted 
                      ? `linear-gradient(120deg, ${alpha(theme.palette.success.light, 0.15)}, ${alpha(theme.palette.success.light, 0.03)})` 
                      : `linear-gradient(to right, ${alpha(theme.palette.background.paper, 0.4)}, ${theme.palette.background.paper})`,
                    p: 1.5,
                    pl: 2.5,
                    borderRadius: 1.5,
                    border: isCompleted 
                      ? `1px solid ${alpha(theme.palette.success.main, 0.25)}` 
                      : `1px solid ${alpha(theme.palette.divider, 0.09)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: isCompleted 
                      ? `0 4px 14px ${alpha(theme.palette.success.main, 0.15)}` 
                      : 'none',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isCompleted
                        ? `0 6px 16px ${alpha(theme.palette.success.main, 0.2)}`
                        : `0 6px 12px ${alpha(theme.palette.divider, 0.2)}`,
                      borderColor: isCompleted 
                        ? alpha(theme.palette.success.main, 0.4)
                        : alpha(theme.palette.primary.main, 0.15),
                    },
                    ...(toggledTodoId === todo._id && {
                      transform: 'scale(0.98)',
                      opacity: 0.9
                    })
                }}>
                  <ListItemIcon sx={{ minWidth: '42px' }}>
                    <Checkbox
                      icon={
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: '6px',
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                            transition: 'all 0.2s'
                          }}
                        />
                      }                      checkedIcon={
                        <Box
                          component={motion.div}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 15,
                            duration: 0.4
                          }}
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: '6px',
                            background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.5)}`
                          }}
                        >
                          <TaskAltIcon sx={{ fontSize: 16 }} />
                        </Box>
                      }
                      edge="start"
                      checked={isCompleted}
                      onChange={() => {
                        // Ensure the todo ID is valid
                        if (todo && todo._id) {
                          setToggledTodoId(todo._id);
                          onTodoToggle(todo._id);
                          // Clear the toggled ID after a delay
                          setTimeout(() => setToggledTodoId(null), 1000);
                        }
                      }}
                      sx={{
                        color: alpha(theme.palette.primary.main, 0.6),
                        padding: '4px',
                        '&.Mui-checked': {
                          color: theme.palette.primary.main
                        },
                        // Improve touch target size
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.25rem'
                        },
                        // Add visual feedback on hover
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                      disableRipple={false} // Enable ripple effect for better feedback
                    />
                  </ListItemIcon>                  <ListItemText
                  primary={
                    <motion.div
                      animate={{ opacity: isCompleted ? 0.7 : 1 }}
                      transition={{ duration: 0.5 }}
                    >                      <Typography
                        variant="body1"
                        sx={{
                          position: 'relative',
                          color: isCompleted ? alpha(theme.palette.success.main, 0.9) : 'text.primary',
                          fontWeight: isCompleted ? 500 : 600,
                          transition: 'all 0.3s',
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {todo.title}                        {isCompleted && (
                          <Box
                            component={motion.div}
                            initial={{ scale: 0, y: -10 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 400, 
                              damping: 10,
                              delay: 0.1
                            }}
                            sx={{
                              ml: 1.5,
                              px: 1.5,
                              py: 0.3,
                              fontSize: '0.7rem',
                              borderRadius: 5,
                              background: `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                              color: 'white',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              boxShadow: `0 3px 8px ${alpha(theme.palette.success.main, 0.3)}`,
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.3)}, transparent)`,
                                animation: 'shimmer 2s infinite',
                                '@keyframes shimmer': {
                                  '0%': { left: '-100%' },
                                  '100%': { left: '100%' }
                                }
                              }
                            }}
                          >
                            <DoneAllIcon fontSize="inherit" />
                            COMPLETED
                          </Box>
                        )}
                      </Typography>
                    </motion.div>
                  }
                  secondary={
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        mt: 1,
                        gap: 1
                      }}
                    >
                      {todo.category && (
                        <Chip
                          label={todo.category}
                          size="small"
                          sx={{
                            borderRadius: '6px',
                            height: '22px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                            color: theme.palette.secondary.dark,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
                            opacity: isCompleted ? 0.6 : 0.9,                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}

                        <Chip
                          icon={<EmojiEventsIcon sx={{ fontSize: '0.75rem !important' }} />}
                          label={`${todo.score} points`}
                          size="small"
                          sx={{
                            borderRadius: '6px',
                            height: '22px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            color: theme.palette.primary.main,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                            opacity: isCompleted ? 0.6 : 0.9,
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      
                      <Box
                        sx={{
                          height: '22px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          color: theme.palette.text.secondary,
                          borderRadius: '6px',
                          px: 1,
                          opacity: 0.7
                        }}
                      >
                        {todo.difficulty}
                      </Box>
                    </Box>
                  }
                />
                </Box>               
              </ListItem>
            );
          })
        ) : todos.length === 0 ? (
          <Box 
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            sx={{ p: 6, textAlign: 'center' }}
          >            <Box
              component={motion.div}
              animate={{ rotate: [-5, 5] }}
              transition={{ repeat: Infinity, repeatType: "reverse", repeatDelay: 4, duration: 0.6 }}
            >
              <Box
                component="img"
                src="https://cdn-icons-png.flaticon.com/512/6194/6194029.png"
                sx={{ 
                  width: 100, 
                  height: 100, 
                  opacity: 0.3, 
                  mb: 3,
                  filter: 'grayscale(0.2)'
                }}
                alt="Empty tasks"
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}>
              No Tasks Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 350, mx: 'auto', lineHeight: 1.6 }}>
              Add some tasks to start building better habits and tracking your daily progress
            </Typography>
            <Button
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              variant="contained"
              color="primary"
              sx={{ 
                mt: 3, 
                px: 3,
                py: 1.2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 16px rgba(66, 99, 235, 0.2)',
                background: 'linear-gradient(45deg, #4263EB, #5C7CFA)',
              }}
              startIcon={<AddIcon />}
            >
              Add Your First Task
            </Button>
          </Box>
        ) : (
          <Box 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            sx={{ p: 6, textAlign: 'center' }}
          >
            <Box
              component="img"
              src="https://cdn-icons-png.flaticon.com/512/6134/6134065.png"
              sx={{ 
                width: 90, 
                height: 90, 
                opacity: 0.3, 
                mb: 3,
                filter: 'grayscale(0.2)'
              }}
              alt="No results"
            />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}>
              No Matches Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 350, mx: 'auto', lineHeight: 1.6 }}>
              Try adjusting your search or category filters
            </Typography>
            <Button 
              variant="outlined"
              color="primary"
              onClick={clearSearch}
              sx={{ 
                mt: 3, 
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
          </Box>
        )}
        </AnimatePresence>
      </List>
    </Paper>
  );
};

export default Todos;
