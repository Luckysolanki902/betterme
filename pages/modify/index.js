// pages/modify/index.js
import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, List, Typography, Box, Dialog, 
  DialogActions, DialogContent, DialogContentText, DialogTitle, 
  Skeleton, Alert, Checkbox, FormControlLabel, Autocomplete,
  Paper, Divider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import Layout from '@/components/Layout';
import TodoListItem from '@/components/TodoListItem';
import EmptyState from '@/components/EmptyState';
import axios from 'axios';

// Difficulty score mapping
const DIFFICULTY_SCORES = {
  easy: 1,
  light: 3,
  medium: 5,
  challenging: 7,
  hard: 10
};

const AdminPanel = () => {
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
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // For displaying errors

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/todos');
      setTodos(res.data);
      const uniqueCategories = [...new Set(res.data.map(todo => todo.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      setError('Error fetching todos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    const priority = parseInt(form.priority, 10);

    if (priority < 1 || priority > todos.length + 1) {
      setError(`Priority must be between 1 and ${todos.length + 1}`);
      return;
    }

    if (!form.category) {
      setError('Category is required');
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
        const res = await axios.put(`/api/todos/${currentTodoId}`, payload);
        if (res.status !== 200) throw new Error('Failed to update');
      } else {
        const res = await axios.post('/api/todos', payload);
        if (res.status !== 201) throw new Error('Failed to create');
      }

      fetchTodos();
      setForm({ 
        title: '', 
        difficulty: 'medium', 
        priority: '', 
        isColorful: false, 
        category: '' 
      });
      setIsEditing(false);
      setCurrentTodoId(null);
    } catch (err) {
      setError('Error submitting todo. Please try again.');
    }
  };

  const handleEdit = (todo) => {
    setForm({ 
      title: todo.title, 
      difficulty: todo.difficulty, 
      priority: todo.priority, 
      isColorful: todo.isColorful,
      category: todo.category,
    });
    setIsEditing(true);
    setCurrentTodoId(todo._id);
  };

  const handleDeleteClick = (id) => {
    setDeleteTodoId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText === 'delete') {
      try {
        const res = await axios.delete(`/api/todos/${deleteTodoId}`);
        if (res.status !== 204) throw new Error('Failed to delete');
        fetchTodos();
        setOpenDialog(false);
        setDeleteConfirmText('');
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

  const totalTodos = todos.length;
  const totalScore = todos.reduce((sum, todo) => sum + todo.score, 0);
  const averageScore = totalTodos ? (totalScore / totalTodos).toFixed(1) : 0;
  
  return (
    <Layout>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Modify Todos
      </Typography>
      
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        {/* Todo Form */}
        <Typography variant="h6" gutterBottom>
          {isEditing ? 'Edit Todo' : 'Create New Todo'}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            fullWidth
            required
            margin="normal"
            variant="outlined"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel id="difficulty-label">Difficulty</InputLabel>
            <Select
              labelId="difficulty-label"
              value={form.difficulty}
              label="Difficulty"
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <MenuItem value="easy">Easy (1 point)</MenuItem>
              <MenuItem value="light">Light (3 points)</MenuItem>
              <MenuItem value="medium">Medium (5 points)</MenuItem>
              <MenuItem value="challenging">Challenging (7 points)</MenuItem>
              <MenuItem value="hard">Hard (10 points)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Priority"
            type="number"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) })}
            fullWidth
            required
            margin="normal"
            variant="outlined"
            InputProps={{ inputProps: { min: 1, step: 1 } }}
            helperText="Lower number = higher priority"
          />

          <Autocomplete
            freeSolo
            options={categories}
            value={form.category}
            onChange={(event, newValue) => {
              setForm({ ...form, category: newValue });
            }}
            onInputChange={(event, newInputValue) => {
              setForm({ ...form, category: newInputValue });
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Category" 
                margin="normal" 
                required 
                variant="outlined"
              />
            )}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.isColorful}
                onChange={(e) => setForm({ ...form, isColorful: e.target.checked })}
                color="primary"
              />
            }
            label="Colorful Background"
          />

          {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}          
          <Box sx={{ mt: 3 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ mr: 2 }}
            >
              {isEditing ? 'Update Todo' : 'Add Todo'}
            </Button>
            {isEditing && (
              <Button 
                variant="outlined" 
                color="secondary" 
                size="large"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Statistics */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Todo Statistics
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ textAlign: 'center', p: 1, minWidth: '100px' }}>
            <Typography variant="h5" color="primary">
              {totalTodos}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Todos
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 1, minWidth: '100px' }}>
            <Typography variant="h5" color="primary">
              {totalScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Points
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 1, minWidth: '100px' }}>
            <Typography variant="h5" color="primary">
              {averageScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Points
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Todo List */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Todo List
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 1 }}>
              <Skeleton variant="rectangular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
              <Box>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} sx={{ mt: 1 }} />
              </Box>
            </Box>
          ))
        ) : todos.length === 0 ? (
          <EmptyState type="todos" />
        ) : (
          <List sx={{ maxHeight: '500px', overflow: 'auto' }}>
            {todos.map((todo) => (
              <TodoListItem
                key={todo._id}
                todo={todo}
                handleEdit={handleEdit}
                handleDeleteClick={handleDeleteClick}
              />
            ))}
          </List>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To delete this todo, please type <strong>delete</strong> below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'delete' to confirm"
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="warning" 
            size='small'
            variant="contained"
            disabled={deleteConfirmText.trim() !== 'delete'}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AdminPanel;
