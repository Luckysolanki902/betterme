// components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { 
  Container, TextField, Button, List, Typography, Box, Dialog, 
  DialogActions, DialogContent, DialogContentText, DialogTitle, 
  Skeleton, Alert, Checkbox, FormControlLabel, Autocomplete
} from '@mui/material';
import Dashboard from '@/components/Dashboard';
import TodoListItem from '@/components/TodoListItem';
import axios from 'axios';

const AdminPanel = () => {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', percentage: 0, priority: '', isColorful: false, category: '' });
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
        percentage: parseFloat(form.percentage), 
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
      setForm({ title: '', percentage: 0, priority: '', isColorful: false, category: '' });
      setIsEditing(false);
      setCurrentTodoId(null);
    } catch (err) {
      setError('Error submitting todo. Please try again.');
    }
  };

  const handleEdit = (todo) => {
    setForm({ 
      title: todo.title, 
      percentage: todo.percentage, 
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
    setForm({ title: '', percentage: 0, priority: '', isColorful: false, category: '' });
    setIsEditing(false);
    setCurrentTodoId(null);
  };

  const totalTodos = todos.length;
  const totalPercentage = todos.reduce((sum, todo) => sum + todo.percentage, 0);
  const averagePercentage = totalTodos ? (totalPercentage / totalTodos).toFixed(2) : 0;

  return (
    <Container maxWidth="md">
      <Typography className='pop' variant="h4" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Admin Panel
      </Typography>
      
      {/* Todo Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <TextField
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Percentage"
          type="number"
          value={form.percentage}
          onChange={(e) => setForm({ ...form, percentage: parseFloat(e.target.value) })}
          fullWidth
          required
          margin="normal"
          InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
        />
        <TextField
          label="Priority"
          type="number"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) })}
          fullWidth
          required
          margin="normal"
          InputProps={{ inputProps: { min: 1, step: 1 } }}
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
              sx={{marginLeft:'0.5rem'}}
            />
          }
          label="Colorful Background"
        />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" color="primary" sx={{ mr: 2 }}>
            {isEditing ? 'Update' : 'Add'} Todo
          </Button>
          {isEditing && (
            <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
              Cancel Edit
            </Button>
          )}
        </Box>
      </Box>

      {/* Statistics */}
      <Box mb={3} sx={{ display: 'flex', justifyContent: 'space-around' }}>
        <Typography className='pop' variant="body1">
          Count: {totalTodos}
        </Typography>
        <Typography className='pop' variant="body1">
          Total: {(totalPercentage).toFixed(2)}%
        </Typography>
        <Typography className='pop' variant="body1">
          Avg: {(averagePercentage * 1).toFixed(2)}%
        </Typography>
      </Box>

      {/* Todo List */}
      <List sx={{ maxHeight: '23rem', overflow: 'auto' }}>
        {isLoading ? (
          Array.from({ length: 20 }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
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
          <Typography variant="body1" color="text.secondary">
            No todos available.
          </Typography>
        ) : (
          // Render Todos in Order
          todos.map((todo) => (
            <TodoListItem
              key={todo._id}
              todo={todo}
              handleEdit={handleEdit}
              handleDeleteClick={handleDeleteClick}
            />
          ))
        )}
      </List>

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

      {/* Dashboard */}
      <Dashboard currentPage={'modify'} />
    </Container>
  );
};

export default AdminPanel;
