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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
  Fade,
  Collapse,
  Alert,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Psychology as PsychologyIcon,
  EmojiEvents as EmojiEventsIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', score: 1, color: '#4caf50', description: 'Simple tasks, minimal effort required' },
  { value: 'light', label: 'Light', score: 3, color: '#8bc34a', description: 'Light tasks, some focus needed' },
  { value: 'medium', label: 'Medium', score: 5, color: '#ff9800', description: 'Moderate effort and concentration' },
  { value: 'challenging', label: 'Challenging', score: 7, color: '#f44336', description: 'Requires significant effort' },
  { value: 'hard', label: 'Hard', score: 10, color: '#9c27b0', description: 'Maximum effort and dedication' },
];

const PRIORITY_LEVELS = [
  { value: 1, label: 'Low', color: '#757575', description: 'Nice to have, no rush' },
  { value: 2, label: 'Normal', color: '#2196f3', description: 'Regular priority task' },
  { value: 3, label: 'High', color: '#ff9800', description: 'Important, should be done soon' },
  { value: 4, label: 'Urgent', color: '#f44336', description: 'Critical, needs immediate attention' },
];

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`modify-tabpanel-${index}`}
    aria-labelledby={`modify-tab-${index}`}
    {...other}
  >
    {value === index && (
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    )}
  </div>
);

const ModifyTodosNew = ({ open, onClose, editingTodo = null }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    difficulty: 'medium',
    priority: 2,
    customCategory: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (open) {
      fetchTodos();
      if (editingTodo) {
        setFormData({
          title: editingTodo.title || '',
          category: editingTodo.category || '',
          difficulty: editingTodo.difficulty || 'medium',
          priority: editingTodo.priority || 2,
          customCategory: ''
        });
        setIsEditing(true);
        setEditingId(editingTodo._id);
        setActiveTab(0); // Start with task details when editing
      } else {
        resetForm();
        setActiveTab(0); // Start with task overview for new tasks
      }
    }
  }, [open, editingTodo]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/todos');
      setTodos(res.data);
      const uniqueCategories = [...new Set(res.data.map(todo => todo.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      setError('Error fetching todos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      difficulty: 'medium',
      priority: 2,
      customCategory: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setActiveTab(0);
  };

  const handleClose = () => {
    resetForm();
    setError('');
    setSuccess('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    const finalCategory = formData.customCategory.trim() || formData.category;
    if (!finalCategory) {
      setError('Category is required');
      return;
    }

    try {
      setLoading(true);
      const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty);
      
      const todoData = {
        title: formData.title.trim(),
        category: finalCategory,
        difficulty: formData.difficulty,
        priority: formData.priority,
        score: selectedDifficulty.score
      };

      if (isEditing) {
        await axios.put(`/api/todos/${editingId}`, todoData);
        setSuccess('Task updated successfully!');
      } else {
        await axios.post('/api/todos', todoData);
        setSuccess('Task created successfully!');
      }

      await fetchTodos();
      resetForm();
      
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

  const handleDelete = async (todoId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/todos/${todoId}`);
      await fetchTodos();
      setSuccess('Task deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Error deleting task');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (todo) => {
    setFormData({
      title: todo.title,
      category: todo.category,
      difficulty: todo.difficulty,
      priority: todo.priority,
      customCategory: ''
    });
    setIsEditing(true);
    setEditingId(todo._id);
    setActiveTab(0);
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 0: return <AssignmentIcon />;
      case 1: return <CategoryIcon />;
      case 2: return <PsychologyIcon />;
      case 3: return <FlagIcon />;
      case 4: return <EmojiEventsIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const getTabLabel = (index) => {
    if (isMobile) {
      return ['Task', 'Category', 'Level', 'Priority', 'Manage'][index];
    }
    return ['Task Details', 'Category', 'Difficulty', 'Priority', 'Manage Tasks'][index];
  };

  const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.value === formData.difficulty);
  const selectedPriority = PRIORITY_LEVELS.find(p => p.value === formData.priority);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          minHeight: isMobile ? '100vh' : '600px',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${theme.palette.background.paper} 100%)`,
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          pb: 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isEditing ? (
                <EditIcon sx={{ color: 'white', fontSize: 20 }} />
              ) : (
                <AddIcon sx={{ color: 'white', fontSize: 20 }} />
              )}
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {/* Alerts */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Box sx={{ p: 2, pb: 0 }}>
                <Alert 
                  severity={error ? 'error' : 'success'} 
                  onClose={() => error ? setError('') : setSuccess('')}
                  sx={{ borderRadius: 2 }}
                >
                  {error || success}
                </Alert>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTab-root': {
                minHeight: 60,
                fontWeight: 600,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
              }
            }}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <Tab
                key={index}
                icon={getStepIcon(index)}
                label={getTabLabel(index)}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 }, height: '400px', overflow: 'auto' }}>
          {/* Tab 0: Task Details */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                What would you like to accomplish?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Give your task a clear, specific title that motivates you.
              </Typography>
              
              <TextField
                fullWidth
                label="Task Title"
                placeholder="e.g., Complete morning workout, Read 20 pages, Write blog post..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                multiline
                rows={3}
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

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setActiveTab(1)}
                  disabled={!formData.title.trim()}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3B5BDB 0%, #8258DB 100%)',
                    }
                  }}
                >
                  Next: Category
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 1: Category */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                How would you categorize this task?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Categories help you organize and track different areas of your life.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Choose existing category:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      onClick={() => setFormData({ ...formData, category: cat, customCategory: '' })}
                      color={formData.category === cat ? 'primary' : 'default'}
                      variant={formData.category === cat ? 'filled' : 'outlined'}
                      sx={{ 
                        borderRadius: 2,
                        '&:hover': { transform: 'translateY(-1px)' },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">or</Typography>
              </Divider>

              <TextField
                fullWidth
                label="Create new category"
                placeholder="e.g., Health, Work, Learning, Personal..."
                value={formData.customCategory}
                onChange={(e) => setFormData({ ...formData, customCategory: e.target.value, category: '' })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setActiveTab(0)}
                  sx={{ borderRadius: 2 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setActiveTab(2)}
                  disabled={!formData.category && !formData.customCategory.trim()}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                  }}
                >
                  Next: Difficulty
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 2: Difficulty */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                How challenging is this task?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This determines the points you'll earn. Higher difficulty = more points!
              </Typography>

              <Grid container spacing={2}>
                {DIFFICULTY_LEVELS.map((level) => (
                  <Grid item xs={12} sm={6} key={level.value}>
                    <Card
                      onClick={() => setFormData({ ...formData, difficulty: level.value })}
                      sx={{
                        cursor: 'pointer',
                        border: 2,
                        borderColor: formData.difficulty === level.value ? level.color : 'transparent',
                        background: formData.difficulty === level.value 
                          ? alpha(level.color, 0.1) 
                          : 'transparent',
                        '&:hover': {
                          borderColor: level.color,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                        borderRadius: 3,
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: level.color, 
                              fontWeight: 700,
                              mr: 1 
                            }}
                          >
                            {level.label}
                          </Typography>
                          <Chip 
                            label={`${level.score} pts`} 
                            size="small" 
                            sx={{ 
                              backgroundColor: level.color,
                              color: 'white',
                              fontWeight: 600
                            }} 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {level.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setActiveTab(1)}
                  sx={{ borderRadius: 2 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => setActiveTab(3)}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                  }}
                >
                  Next: Priority
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 3: Priority */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                How urgent is this task?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Priority helps you focus on what matters most right now.
              </Typography>

              <Grid container spacing={2}>
                {PRIORITY_LEVELS.map((level) => (
                  <Grid item xs={12} sm={6} key={level.value}>
                    <Card
                      onClick={() => setFormData({ ...formData, priority: level.value })}
                      sx={{
                        cursor: 'pointer',
                        border: 2,
                        borderColor: formData.priority === level.value ? level.color : 'transparent',
                        background: formData.priority === level.value 
                          ? alpha(level.color, 0.1) 
                          : 'transparent',
                        '&:hover': {
                          borderColor: level.color,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                        borderRadius: 3,
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: level.color, 
                            fontWeight: 700,
                            mb: 1 
                          }}
                        >
                          {level.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {level.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => setActiveTab(2)}
                  sx={{ borderRadius: 2 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  endIcon={<CheckCircleIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #43a047 0%, #7cb342 100%)',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    `${isEditing ? 'Update' : 'Create'} Task`
                  )}
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 4: Manage Tasks */}
          <TabPanel value={activeTab} index={4}>
            <Box>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                Manage Your Tasks
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Edit or delete existing tasks.
              </Typography>

              {loading && todos.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {todos.map((todo, index) => (
                    <motion.div
                      key={todo._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ListItem
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 1,
                          background: alpha(theme.palette.background.paper, 0.5),
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={600}>
                              {todo.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label={todo.category} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={todo.difficulty} 
                                size="small" 
                                color="primary"
                              />
                              <Chip 
                                label={`Priority: ${todo.priority}`} 
                                size="small" 
                                color="secondary"
                              />
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEdit(todo)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(todo._id)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              )}
            </Box>
          </TabPanel>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ModifyTodosNew;
