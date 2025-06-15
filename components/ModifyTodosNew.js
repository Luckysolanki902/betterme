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

const ModifyTodosNew = ({ open, onClose, editingTodo = null, todos = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    difficulty: 'medium',
    priority: 1,
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
          priority: parseInt(editingTodo.priority) || 1, // Ensure it's a number
          customCategory: ''
        });
        setIsEditing(true);
        setActiveStep(0);
      } else {
        resetForm();
        setActiveStep(0);
      }
    }
  }, [open, editingTodo, todos]);

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      difficulty: 'medium',
      priority: 1,
      customCategory: ''
    });
    setIsEditing(false);
    setActiveStep(0);
    setError('');
    setSuccess('');
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
        priority: parseInt(formData.priority) // Ensure it's a number
      };

      if (isEditing) {
        await axios.put(`/api/todos/${editingTodo._id}`, todoData);
        setSuccess('Task updated successfully!');
      } else {
        await axios.post('/api/todos', todoData);
        setSuccess('Task created successfully!');
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

  const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty);
  const maxPriority = todos.length + 1;

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
    >      {/* Header */}
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
              {steps[activeStep].icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Step {activeStep + 1} of {steps.length}: {steps[activeStep].label}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>      </Box>

      <Box sx={{ p: 0 }}>
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
                        Choose from existing categories:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {categories.map((cat) => (
                          <Chip
                            key={cat}
                            label={cat}
                            variant={formData.category === cat ? 'filled' : 'outlined'}
                            onClick={() => setFormData({ ...formData, category: cat, customCategory: '' })}
                            sx={{
                              borderRadius: 2,
                              '&.MuiChip-filled': {
                                background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                                color: 'white',
                              }
                            }}
                          />
                        ))}
                      </Box>
                      <Divider sx={{ my: 2 }}>
                        <Typography variant="caption" color="text.secondary">OR</Typography>
                      </Divider>
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    autoFocus
                    label={categories.length > 0 ? "Create new category" : "Category"}
                    placeholder="e.g., Health, Work, Personal, Learning..."
                      onKeyDown={(e) => {
                      if (e.key === 'Enter' && formData.customCategory.trim()) {
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
                      {Array.from({ length: maxPriority }, (_, i) => i + 1).map((num) => (
                        <MenuItem key={num} value={num}>
                          Priority {num} {num === 1 ? '(Highest)' : num === maxPriority ? '(Lowest)' : ''}
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
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2 }}
            >
              Back
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
        </Box>      </Box>
    </Box>
  );
};

export default ModifyTodosNew;
