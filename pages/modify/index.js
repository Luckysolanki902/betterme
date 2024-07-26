import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Skeleton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Dashboard from '@/components/Dashboard';

const AdminPanel = () => {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ title: '', percentage: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTodoId, setDeleteTodoId] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Loading state

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
    if (isEditing) {
      await fetch(`/api/todos/${currentTodoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
    }
    fetchTodos();
    setForm({ title: '', percentage: 0 });
    setIsEditing(false);
    setCurrentTodoId(null);
  };

  const handleEdit = (todo) => {
    setForm({ title: todo.title, percentage: todo.percentage });
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
    setForm({ title: '', percentage: 0 });
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
        {(isLoading || !isLoading)? (
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
            <ListItem key={todo._id} divider>
              <ListItemText
                primary={todo.title}
                secondary={`Percentage: ${todo.percentage}%`}
                primaryTypographyProps={{ style: { fontFamily: 'Poppins' } }}
                secondaryTypographyProps={{ style: { fontFamily: 'Poppins' } }}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(todo)}>
                  <Edit />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(todo._id)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
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
