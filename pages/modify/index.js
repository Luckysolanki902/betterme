import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Skeleton, Alert } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Dashboard from '@/components/Dashboard';
import TodoListItem from '@/components/ModifyTodos';

const AdminPanel = () => {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ title: '', percentage: 0, priority: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTodoId, setDeleteTodoId] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // For displaying errors
  

  const router = useRouter();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setIsLoading(true);
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    const priority = parseInt(form.priority, 10);

    if (priority < 1 || priority > todos.length + 1) {
      setError('Priority must be between 1 and n+1 (where n is the number of todos)');
      return;
    }

    try {
      if (isEditing) {
        await fetch(`/api/todos/${currentTodoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...form, priority }),
        });
      } else {
        await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...form, priority }),
        });
      }
      fetchTodos();
      setForm({ title: '', percentage: 0, priority: '' });
      setIsEditing(false);
      setCurrentTodoId(null);
    } catch (err) {
      setError('Error submitting todo. Please try again.');
    }
  };

  const handleEdit = (todo) => {
    setForm({ title: todo.title, percentage: todo.percentage, priority: todo.priority });
    setIsEditing(true);
    setCurrentTodoId(todo._id);
  };

  const handleDeleteClick = (id) => {
    setDeleteTodoId(id);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText === 'delete') {
      await fetch(`/api/todos/${deleteTodoId}`, {
        method: 'DELETE',
      });
      fetchTodos();
      setOpenDialog(false);
      setDeleteConfirmText('');
    }
  };

  const handleDeleteCancel = () => {
    setOpenDialog(false);
    setDeleteConfirmText('');
  };

  const handleCancelEdit = () => {
    setForm({ title: '', percentage: 0, priority: '' });
    setIsEditing(false);
    setCurrentTodoId(null);
  };

  const totalTodos = todos.length;
  const totalPercentage = todos.reduce((sum, todo) => sum + todo.percentage, 0);
  const averagePercentage = totalTodos ? (totalPercentage / totalTodos).toFixed(2) : 0;

  return (
    <Container maxWidth="md">
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
          InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
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
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" color="primary" sx={{ mr: 2 }}>
          {isEditing ? 'Update' : 'Add'} Todo
        </Button>
        {isEditing && (
          <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
            Cancel Edit
          </Button>
        )}
      </Box>

      <Box mb={3} sx={{ display: 'flex', justifyContent: 'space-around' }}>
        <Typography className='pop' variant="body1">
          Count: {totalTodos}
        </Typography>
        <Typography className='pop' variant="body1">
          Total: {totalPercentage.toFixed(2)}%
        </Typography>
        <Typography className='pop' variant="body1">
          Avg: {averagePercentage}%
        </Typography>
      </Box>

      <List sx={{ maxHeight: '23rem', overflow: 'auto' }}>
        {isLoading ? (
          Array.from({ length: 20 }).map((_, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={<Skeleton variant="text" width={100} />}
                secondary={<Skeleton variant="text" width={50} />}
              />
              <ListItemSecondaryAction>
                <Skeleton variant="circular" width={40} height={40} />
              </ListItemSecondaryAction>
            </ListItem>
          ))
        ) : (
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
      <div style={{ marginBottom: '5rem' }}></div>

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
          <Button onClick={handleDeleteConfirm} color="warning" disabled={deleteConfirmText !== 'delete'}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dashboard currentPage={'modify'} />
    </Container>
  );
};

export default AdminPanel;
