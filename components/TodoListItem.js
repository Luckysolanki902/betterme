// components/TodoListItem.js
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box, Chip, alpha, useTheme } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';

// Custom style for the priority badge
const PriorityBadge = ({ priority }) => {
  const theme = useTheme();
  
  // Generate different gradient backgrounds based on priority
  const getBadgeGradient = (priority) => {
    switch(priority) {
      case 1:
        return `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`;
      case 2:
        return `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`;
      case 3:
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.light} 100%)`;
      case 4:
        return `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`;
      case 5:
        return `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`;
      default:
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;
    }
  };
  
  return (
    <Box      component={motion.div}      
      whileHover={{ scale: 1.12, rotate: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 12 }}
      sx={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: getBadgeGradient(priority),
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '14px',
        mr: 2.5,
        typography: 'body1',
        boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.45)}`,
        position: 'relative',
        overflow: 'hidden',
        fontSize: '1.2rem',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0))',
          borderTopLeftRadius: '14px',
          borderTopRightRadius: '14px',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '25%',
          background: 'rgba(0, 0, 0, 0.1)',
          borderBottomLeftRadius: '14px',
          borderBottomRightRadius: '14px',
        }
      }}
    >
      {priority}
    </Box>
  );
};

// Color mapping for difficulty levels
const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return '#4caf50'; // Green
    case 'light':
      return '#8bc34a'; // Light Green
    case 'medium':
      return '#ff9800'; // Orange
    case 'challenging':
      return '#f44336'; // Red
    case 'hard':
      return '#9c27b0'; // Purple
    default:
      return '#ff9800'; // Default to orange
  }
};

const TodoListItem = ({ todo, handleEdit, handleDeleteClick }) => {
  const theme = useTheme();
  
  return (
    <ListItem 
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2.5, 
        bgcolor: 'background.paper',
        borderRadius: 3,
        mb: 1.5,
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        '&:hover': {
          boxShadow: `0 6px 16px ${alpha(theme.palette.divider, 0.8)}`,
          transform: 'translateY(-3px)',
        },
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          opacity: 0.7,
        }
      }}
    >
      <PriorityBadge priority={todo.priority} />
      <ListItemText
        primary={
          <Typography 
            variant="body1" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              fontSize: '1rem',
              mb: 1
            }}
          >
            {todo.title}
          </Typography>
        }
        secondary={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {todo.category && (
              <Chip 
                label={todo.category} 
                size="small" 
                sx={{ 
                  borderRadius: 1.5, 
                  fontSize: '0.7rem',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.dark,
                  fontWeight: 500
                }}
              />
            )}
            <Chip
              label={todo.difficulty}
              size="small"
              sx={{ 
                backgroundColor: alpha(getDifficultyColor(todo.difficulty), 0.15),
                color: getDifficultyColor(todo.difficulty),
                fontWeight: 500,
                borderRadius: 1.5,
                border: `1px solid ${alpha(getDifficultyColor(todo.difficulty), 0.3)}`
              }}
            />
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ 
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              <Box 
                component="span"
                sx={{ 
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  mr: 0.75,
                  opacity: 0.7
                }} 
              />
              {todo.score} points
            </Typography>
          </Box>
        }
      />
      <Box sx={{ display: 'flex', ml: 1 }}>
        <IconButton 
          edge="end" 
          aria-label="edit" 
          onClick={() => handleEdit(todo)}
          sx={{ 
            color: theme.palette.primary.main,
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } 
          }}
        >          <Edit fontSize="small" />
        </IconButton>
        <IconButton 
          edge="end" 
          aria-label="delete" 
          onClick={() => handleDeleteClick(todo._id)}
          sx={{ 
            color: theme.palette.error.main,
            '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } 
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </ListItem>
  );
}
export default TodoListItem;
