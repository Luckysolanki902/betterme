import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Breadcrumbs, Link } from '@mui/material';
import { Edit, Delete, Cancel, Home as HomeIcon, AdminPanelSettings as AdminPanelSettingsIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';

const AdminPanel = () => {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ title: '', percentage: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTodoId, setDeleteTodoId] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data);
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
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3,}}>
        <Link  sx={{textDecoration:'none'}}  color="inherit" href="/" onClick={(e) => { e.preventDefault(); router.push('/'); }}>
          BetterMe
        </Link>
        <Link sx={{textDecoration:'none'}}   color="inherit" href="/admin" onClick={(e) => { e.preventDefault(); router.push('/admin'); }}>
          Admin
        </Link>
        <Typography color="textPrimary">Modify</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel
      </Typography>

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

      <Box mb={3} sx={{display:'flex', justifyContent:'space-around'}}>
        <Typography variant="body1">
          Count: {totalTodos}
        </Typography>
        <Typography variant="body1">
          Total: {totalPercentage.toFixed(2)}%
        </Typography>
        <Typography variant="body1">
          Avg: {averagePercentage}%
        </Typography>
      </Box>

      <List sx={{ maxHeight: '23rem', overflow: 'auto' }}>
        {todos.map((todo) => (
          <ListItem key={todo._id} divider>
            <ListItemText
              primary={todo.title}
              secondary={`Percentage: ${todo.percentage}%`}
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
        ))}
      </List>
<div style={{marginBottom:'5rem'}}></div>

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
    </Container>
  );
};

export default AdminPanel;
