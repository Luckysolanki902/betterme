// components/ModifyTodos.js
import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Alert,
  Grid,
  Paper,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  alpha,
  Autocomplete,
  Slide,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Badge,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CategoryIcon from '@mui/icons-material/Category';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import TodoListItem from '@/components/TodoListItem';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Difficulty score mapping
const DIFFICULTY_SCORES = {
  easy: 1,
  light: 3,
  medium: 5,
  challenging: 7,
  hard: 10
};

const ModifyTodos = ({ isDialog = false, onClose = null }) => {
  const theme = useTheme();
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ 
    title: '', 
    difficulty: 'medium',
    priority: '', 
    isColorful: false, 
    category: '' 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTodoId, setDeleteTodoId] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');      const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);      const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/todos');
      setTodos(res.data);
      const uniqueCategories = [...new Set(res.data.map(todo => todo.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      setError('Error fetching todos');
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!form.category) {
      setError('Category is required');
      return;
    }
    
    const priority = form.priority ? parseInt(form.priority, 10) : todos.length + 1;
    if (priority < 1 || priority > todos.length + 1) {
      setError(`Priority must be between 1 and ${todos.length + 1}`);
      return;
    }

    try {
      const payload = { 
        title: form.title, 
        difficulty: form.difficulty, 
        priority, 
        isColorful: form.isColorful,
        category: form.category,
      };

      if (isEditing) {
        await axios.put(`/api/todos/${currentTodoId}`, payload);
        setSuccess('Todo updated successfully!');
      } else {
        await axios.post('/api/todos', payload);
        setSuccess('Todo created successfully!');
      }

      fetchTodos();
      resetForm();
    } catch (err) {
      setError('Error submitting todo. Please try again.');
    }
  };

  const resetForm = () => {
    setForm({ 
      title: '', 
      difficulty: 'medium', 
      priority: '', 
      isColorful: false, 
      category: '' 
    });
    setIsEditing(false);
    setCurrentTodoId(null);
  };

  const handleEdit = (todo) => {
    setForm({ 
      title: todo.title, 
      difficulty: todo.difficulty, 
      priority: todo.priority, 
      isColorful: todo.isColorful || false,
      category: todo.category || '',
    });
    setIsEditing(true);
    setCurrentTodoId(todo._id);
    setSuccess('');
  };

  const handleDeleteClick = (id) => {
    setDeleteTodoId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText === 'delete') {
      try {
        await axios.delete(`/api/todos/${deleteTodoId}`);
        fetchTodos();
        setOpenDialog(false);
        setDeleteConfirmText('');
        setSuccess('Todo deleted successfully!');
      } catch (err) {
        setError('Error deleting todo. Please try again.');
      }
    }
  };

  const handleDeleteCancel = () => {
    setOpenDialog(false);
    setDeleteConfirmText('');
  };

  const handleCancelEdit = () => {
    resetForm();
    setSuccess('');
  };
  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Loading Indicator */}
      {isLoading && !initialLoadComplete && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main, mb: 3 }} />
          <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
            Loading your tasks...
          </Typography>
        </Box>
      )}
      
      {/* Form Section */}
      {(!isLoading || initialLoadComplete) && (
      <Box>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: 3, 
            borderRadius: 3,
            background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)}, ${theme.palette.background.paper})`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4263EB 0%, #9370DB 100%)',
            }
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: 1 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 2, borderRadius: 1 }}
              onClose={() => setSuccess('')}
              icon={<CheckCircleOutlineIcon fontSize="inherit" />}
            >
              {success}
            </Alert>
          )}
            <Box
            sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #4263EB 30%, #9370DB 90%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(66, 99, 235, 0.2)',
              }}
            >
              {isEditing ? <EditIcon sx={{ color: 'white' }} /> : <AddIcon sx={{ color: 'white' }} />}
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1.3rem',
                background: 'linear-gradient(45deg, #4263EB 30%, #9370DB 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isEditing ? 'Edit' : 'Add New'} Task
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>              <Grid item xs={12}>                <TextField
                  label="Task Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="What do you want to accomplish today?"
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(8px)',
                      height: '56px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.3),
                        borderWidth: '1px',
                        transition: 'all 0.2s'
                      },
                  
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '1rem',
                      padding: '14px 18px',
                      fontWeight: 500
                    }
                  }}
                />
              </Grid>
                <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel id="difficulty-label">Difficulty</InputLabel>
                  <Select
                    labelId="difficulty-label"
                    value={form.difficulty}
                    label="Difficulty"
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    sx={{ 
                      borderRadius: '12px',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.3),
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                      },
                    }}
                  >
                    <MenuItem value="easy">Easy (1 point)</MenuItem>
                    <MenuItem value="light">Light (3 points)</MenuItem>
                    <MenuItem value="medium">Medium (5 points)</MenuItem>
                    <MenuItem value="challenging">Challenging (7 points)</MenuItem>
                    <MenuItem value="hard">Hard (10 points)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
                <Grid item xs={12} sm={6}>                <Autocomplete
                  freeSolo
                  value={form.category || ''}
                  onChange={(event, newValue) => {
                    setForm({ ...form, category: newValue || '' });
                  }}
                  inputValue={form.category || ''}
                  onInputChange={(event, newInputValue) => {
                    setForm({ ...form, category: newInputValue || '' });
                  }}
                  options={categories || []}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      size="medium"
                      placeholder="Select or create new"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          background: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(8px)',
                          '& fieldset': {
                            borderColor: alpha(theme.palette.divider, 0.3),
                            borderWidth: '1px',
                            transition: 'all 0.2s'
                          },
                          '&:hover fieldset': {
                            borderColor: alpha(theme.palette.primary.main, 0.5)
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                          }                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500
                        }
                      }}
                    />
                  )}
                />
              </Grid>
                <Grid item xs={12} sm={6}>                <TextField
                  label="Priority Order"
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  fullWidth
                
                  helperText={`1-${todos.length + 1}, lower number = higher priority`}
                  variant="outlined"
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(8px)',
                      height: '56px',
                      '& fieldset': {
                        borderColor: alpha(theme.palette.divider, 0.3),
                        borderWidth: '1px',
                        transition: 'all 0.2s'
                      },
                      '&:hover fieldset': {
                        borderColor: alpha(theme.palette.warning.main, 0.5)
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.warning.main,
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.warning.main, 0.1)}`
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 600
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '1rem',
                      padding: '14px 16px',
                      fontWeight: 500
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: '0.8rem',
                      marginTop: '4px'
                    }
                  }}
                />
              </Grid>
                <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                    }
                  }}
                  onClick={() => setForm({ ...form, isColorful: !form.isColorful })}
                >                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.isColorful}
                        onChange={(e) => setForm({ ...form, isColorful: e.target.checked })}
                        name="isColorful"
                        size='small'
                        sx={{
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                          transform: 'scale(0.9)',
                        }}
                      />
                    }
                    label={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        Make Colorful
                      </Typography>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12}>                <Box 
                  component={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 2, 
                    mt: 3 
                  }}
                >
                  {isEditing && (
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      startIcon={<CancelIcon />}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.3,
                        px: 2.5,
                        border: 'none',
                        backgroundColor: alpha(theme.palette.text.secondary, 0.08),
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.text.secondary, 0.15),
                          border: 'none',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cancel
                    </Button>
                  )}                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isEditing ? <SaveIcon /> : <AddIcon />}
                    sx={{
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: 'linear-gradient(to right, #4263EB, #9370DB)',
                      boxShadow: '0 6px 14px rgba(66, 99, 235, 0.25)',
                      py: 1.3,
                      px: 4,
                      '&:hover': {
                        boxShadow: '0 8px 16px rgba(66, 99, 235, 0.35)',
                        transform: 'translateY(-2px)',
                        background: 'linear-gradient(to right, #3b5bdb, #8557d7)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isEditing ? 'Update' : 'Create'} Task
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>        </Paper>
      </Box>
      )}
      
      {/* Todo List */}
      {(!isLoading || initialLoadComplete) && (
      <Box>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Your Tasks
        </Typography>
        
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <List sx={{ p: 0 }}>
            <AnimatePresence>
              {todos.map((todo) => (
                <motion.div
                  key={todo._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  layout
                >
                  <TodoListItem
                    todo={todo}
                    handleEdit={handleEdit}
                    handleDeleteClick={handleDeleteClick}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {todos.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No tasks yet. Add your first task above!
                </Typography>
              </Box>
            )}
          </List>
        </Paper>
      </Box>)}      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. Type "delete" to confirm.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            disabled={deleteConfirmText !== 'delete'}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModifyTodos;
