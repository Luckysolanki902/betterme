// components/ModifyTodosNew.js
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  Box, 
  Typography, 
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
  Alert,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Psychology as PsychologyIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Difficulty levels configuration
const DIFFICULTY_LEVELS = [
  { 
    value: 'easy', 
    label: 'Easy', 
    score: 1, 
    color: '#10B981', 
    description: 'Simple tasks that require minimal effort',
    examples: ['Check emails', 'Make bed', 'Drink water']
  },
  { 
    value: 'light', 
    label: 'Light', 
    score: 3, 
    color: '#3B82F6', 
    description: 'Light tasks with moderate engagement',
    examples: ['Quick workout', 'Read article', 'Call a friend']
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    score: 5, 
    color: '#F59E0B', 
    description: 'Standard tasks requiring focused attention',
    examples: [ 'Study session', 'Plan weekly goals']
  },
  { 
    value: 'challenging', 
    label: 'Challenging', 
    score: 7, 
    color: '#EF4444',
    description: 'Demanding tasks that push your limits',
    examples: ['Learn new skill', 'Important presentation', 'Difficult conversation']
  },
  { 
    value: 'hard', 
    label: 'Hard', 
    score: 10, 
    color: '#8B5CF6',
    description: 'Complex tasks requiring significant effort',
    examples: ['9-5 Job', 'Work on Startup']
  }
];

const ModifyTodosNew = ({ open, onClose, editingTodo = null, todos = [], onTodoUpdate, onTodoDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showList, setShowList] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    difficulty: 'medium',
    priority: todos.length + 1, // Default to lowest priority
    customCategory: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const steps = [
    { label: 'Task Details', icon: <AssignmentIcon /> },
    { label: 'Category', icon: <CategoryIcon /> },
    { label: 'Difficulty', icon: <PsychologyIcon /> },
    { label: 'Priority', icon: <FlagIcon /> }
  ];

  useEffect(() => {
    if (open) {
      // Get unique categories from todos prop
      const uniqueCategories = [...new Set(todos.map(todo => todo.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      if (editingTodo) {
        setFormData({
          title: editingTodo.title || '',
          category: editingTodo.category || '',
          difficulty: editingTodo.difficulty || 'medium',
          priority: parseInt(editingTodo.priority) || 1,
          customCategory: ''
        });
        setIsEditing(true);
        setActiveStep(0);
        setShowList(false); // Show form directly when editing
      } else {
        resetForm();
        setActiveStep(0);
        setShowList(true); // Show list when creating new
      }
    }
  }, [open, editingTodo, todos]);

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      difficulty: 'medium',
      priority: todos.length + 1, // Default to lowest priority
      customCategory: ''
    });
    setIsEditing(false);
    setActiveStep(0);
    setError('');
    setSuccess('');
    setShowList(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate form
      if (!formData.title.trim()) {
        setError('Task title is required');
        return;
      }
      
      const finalCategory = formData.customCategory.trim() || formData.category;
      if (!finalCategory) {
        setError('Category is required');
        return;
      }

      const todoData = {
        title: formData.title.trim(),
        category: finalCategory,
        difficulty: formData.difficulty,
        priority: parseInt(formData.priority)
      };

      if (isEditing) {
        await axios.put(`/api/todos/${editingTodo._id}`, todoData);
        setSuccess('Task updated successfully!');
        if (onTodoUpdate) onTodoUpdate();
      } else {
        await axios.post('/api/todos', todoData);
        setSuccess('Task created successfully!');
        if (onTodoUpdate) onTodoUpdate();
      }
      
      setTimeout(() => {
        setSuccess('');
        handleClose();
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving task');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (todo) => {
    setFormData({
      title: todo.title || '',
      category: todo.category || '',
      difficulty: todo.difficulty || 'medium',
      priority: parseInt(todo.priority) || 1,
      customCategory: ''
    });
    setIsEditing(true);
    setShowList(false);
    setActiveStep(0);
  };

  const handleDelete = async (todoId) => {
    try {
      setLoading(true);
      await axios.delete(`/api/todos/${todoId}`);
      setSuccess('Task deleted successfully!');
      if (onTodoDelete) onTodoDelete();
      setTimeout(() => {
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting task');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    resetForm();
    setShowList(false);
    setActiveStep(0);
  };

  const handleBackToList = () => {
    setShowList(true);
    setIsEditing(false);
    setActiveStep(0);
    setError('');
    setSuccess('');
  };

  const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty);

  const canProceedFromStep = (step) => {
    switch (step) {
      case 0: return formData.title.trim().length > 0;
      case 1: return formData.category || formData.customCategory.trim();
      case 2: return formData.difficulty;
      case 3: return formData.priority >= 1;
      default: return true;
    }
  };
  return (
    <Box
      sx={{
        borderRadius: isMobile ? 0 : 3,
        minHeight: isMobile ? '100vh' : '600px',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${theme.palette.background.paper} 100%)`,
        backdropFilter: 'blur(20px)',
        width: '100%',
        height: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          pb: 2,
          pt: 2,
          px: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              {showList ? <ListIcon /> : steps[activeStep]?.icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {showList ? 'Manage Tasks' : (isEditing ? 'Edit Task' : 'Create New Task')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showList ? `${todos.length} task${todos.length !== 1 ? 's' : ''} total` : `Step ${activeStep + 1} of ${steps.length}: ${steps[activeStep]?.label}`}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 0 }}>
        {showList ? (
          // Todo List View
          <Box sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Your Tasks
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3B5BDB 0%, #8258DB 100%)',
                  }
                }}
              >
                Create New Task
              </Button>
            </Box>

            {todos.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  color: 'text.secondary'
                }}
              >
                <AssignmentIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  No tasks yet
                </Typography>
                <Typography variant="body2">
                  Create your first task to get started!
                </Typography>
              </Box>
            ) : (
              <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                <AnimatePresence>
                  {todos.map((todo, index) => {
                    const difficultyLevel = DIFFICULTY_LEVELS.find(d => d.value === todo.difficulty);
                    return (
                      <motion.div
                        key={todo._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <ListItem
                          sx={{
                            mb: 1,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                              borderColor: alpha(theme.palette.primary.main, 0.2),
                            }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {todo.title}
                                </Typography>
                                <Chip
                                  label={`${difficultyLevel?.score || 0} pts`}
                                  size="small"
                                  sx={{
                                    backgroundColor: difficultyLevel?.color || theme.palette.primary.main,
                                    color: 'white',
                                    fontWeight: 600,
                                    minWidth: 50,
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={todo.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem' }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Priority {todo.priority}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  • {difficultyLevel?.label || 'Medium'}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Edit task">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(todo)}
                                  sx={{
                                    color: theme.palette.primary.main,
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete task">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(todo._id)}
                                  sx={{
                                    color: theme.palette.error.main,
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </List>
            )}
          </Box>
        ) : (
          // Form View
          <>
            {/* Progress Indicator */}
            <Box sx={{ px: 3, pt: 2, pb: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {steps.map((step, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: index <= activeStep 
                        ? theme.palette.primary.main 
                        : alpha(theme.palette.primary.main, 0.2),
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ px: 3, pb: 3, minHeight: 400 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step 0: Task Details */}
                  {activeStep === 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom fontWeight={700}>
                        What would you like to accomplish?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Give your task a clear, specific title that motivates you.
                      </Typography>
                      
                      <TextField
                        fullWidth
                        autoFocus
                        label="Task Title"
                        placeholder="e.g., Complete morning workout, Read 20 pages, Write blog post..."
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && formData.title.trim()) {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            fontSize: '1.1rem',
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.primary.main,
                              borderWidth: 2,
                            }
                          }
                        }}
                      />

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Examples: "Exercise for 30 minutes", "Read chapter 5", "Complete project proposal"
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Step 1: Category */}
                  {activeStep === 1 && (
                    <Box>
                      <Typography variant="h6" gutterBottom fontWeight={700}>
                        How would you categorize this task?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Categories help you organize and track different areas of your life.
                      </Typography>

                      {categories.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Choose from your categories:
                          </Typography>
                          <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            {categories.map((cat) => (
                              <Grid item key={cat}>
                                <Card
                                  sx={{
                                    cursor: 'pointer',
                                    border: formData.category === cat 
                                      ? `2px solid ${theme.palette.primary.main}` 
                                      : `2px solid transparent`,
                                    borderRadius: 2,
                                    transition: 'all 0.2s ease',
                                    background: formData.category === cat 
                                      ? alpha(theme.palette.primary.main, 0.1)
                                      : 'background.paper',
                                    '&:hover': {
                                      borderColor: theme.palette.primary.main,
                                      transform: 'translateY(-2px)',
                                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                    }
                                  }}
                                  onClick={() => setFormData({ ...formData, category: cat, customCategory: '' })}
                                >
                                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Typography variant="body2" fontWeight={600} textAlign="center">
                                      {cat}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                          <Divider sx={{ my: 3 }}>
                            <Typography variant="caption" color="text.secondary">OR CREATE NEW</Typography>
                          </Divider>
                        </Box>
                      )}

                      <TextField
                        fullWidth
                        autoFocus={categories.length === 0}
                        label={categories.length > 0 ? "Create new category" : "Category"}
                        placeholder="e.g., Health, Work, Personal, Learning..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (formData.customCategory.trim() || formData.category)) {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value, category: '' })}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                          }
                        }}
                      />

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Popular categories: Health & Fitness, Work & Career, Personal Development, Relationships, Hobbies
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Step 2: Difficulty */}
                  {activeStep === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom fontWeight={700}>
                        How challenging is this task?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Choose the difficulty level to earn appropriate points when completed.
                      </Typography>

                      <Grid container spacing={2}>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <Grid item xs={12} sm={6} key={level.value}>
                            <Paper
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                border: formData.difficulty === level.value 
                                  ? `2px solid ${level.color}` 
                                  : `2px solid transparent`,
                                borderRadius: 3,
                                transition: 'all 0.2s ease',
                                background: formData.difficulty === level.value 
                                  ? alpha(level.color, 0.1)
                                  : 'background.paper',
                                '&:hover': {
                                  borderColor: level.color,
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 4px 12px ${alpha(level.color, 0.3)}`,
                                }
                              }}
                              onClick={() => setFormData({ ...formData, difficulty: level.value })}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip
                                  label={`${level.score} pts`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: level.color,
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {level.label}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {level.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                e.g., {level.examples.join(', ')}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Step 3: Priority */}
                  {activeStep === 3 && (
                    <Box>
                      <Typography variant="h6" gutterBottom fontWeight={700}>
                        What's the priority of this task?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Lower numbers mean higher priority. This determines the order in your task list.
                      </Typography>

                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Priority Level</InputLabel>
                        <Select
                          value={formData.priority}
                          label="Priority Level"
                          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                          sx={{ borderRadius: 3 }}
                        >
                          {Array.from({ length: Math.max(todos.length + 1, 1) }, (_, i) => i + 1).map((num) => (
                            <MenuItem key={num} value={num}>
                              Priority {num} {num === 1 ? '(Highest)' : num === Math.max(todos.length + 1, 1) ? '(Lowest)' : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          💡 <strong>Tip:</strong> Priority 1 will appear at the top of your task list, 
                          while higher numbers appear lower. Choose based on urgency and importance.
                        </Typography>
                      </Paper>
                      
                      {selectedDifficulty && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            This {selectedDifficulty.label.toLowerCase()} task will earn you <strong>{selectedDifficulty.score} points</strong> when completed.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Alerts */}
              {error && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                  {success}
                </Alert>
              )}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  onClick={activeStep === 0 ? handleBackToList : handleBack}
                  startIcon={activeStep === 0 ? <ListIcon /> : <ArrowBackIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {activeStep === 0 ? 'Back to List' : 'Back'}
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {activeStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!canProceedFromStep(activeStep)}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #3B5BDB 0%, #8258DB 100%)',
                        }
                      }}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading || !canProceedFromStep(activeStep)}
                      startIcon={loading ? null : <SaveIcon />}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        }
                      }}
                    >
                      {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ModifyTodosNew;
