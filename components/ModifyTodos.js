import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

// Custom style for the priority badge
const PriorityBadge = ({ priority }) => (
  <Box
    sx={{
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'primary.main',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '0.5rem',
      mr: 2,
      typography: 'body1',
      opacity:'0.9'
    }}
  >
    {priority}
  </Box>
);

const TodoListItem = ({ todo, handleEdit, handleDeleteClick }) => (
  <ListItem key={todo._id} divider sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper' }}>
    <PriorityBadge priority={todo.priority} />
    <ListItemText
      primary={
        <Typography variant="h6" component="div" sx={{ fontFamily: 'Poppins', fontWeight: 400, wordBreak:'break-word' }}>
          {todo.title}
        </Typography>
      }
      secondary={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" component="div" sx={{ fontFamily: 'Poppins', color: 'text.secondary' }}>
          Percentage: {todo.percentage}%
        </Typography>
        <Box>
      <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(todo)} >
        <Edit />
      </IconButton>
      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(todo._id)} >
        <Delete />
      </IconButton>
    </Box>
        </Box>
      }
      sx={{ flex: 1, ml: 2 }}
    />

  </ListItem>
);

export default TodoListItem;
