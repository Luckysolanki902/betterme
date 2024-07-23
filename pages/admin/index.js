import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box } from '@mui/material';
import { Edit, Delete, Cancel } from '@mui/icons-material';
import { useRouter } from 'next/router';

const AdminPanel = () => {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState({ title: '', percentage: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState(null);

  const router = useRouter()
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

  const handleDelete = async (id) => {
    await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    });
    fetchTodos();
  };

  const handleCancelEdit = () => {
    setForm({ title: '', percentage: 0 });
    setIsEditing(false);
    setCurrentTodoId(null);
  };

  return (
    <Container maxWidth="md" >
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
          InputProps={{ inputProps: { min: 0, max: 1, step:0.01 } }}
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
      <List sx={{maxHeight:'23rem', overflow: 'auto'}}>
        {todos?.map((todo) => (
          <ListItem key={todo._id} divider>
            <ListItemText
              primary={todo.title}
              secondary={`Percentage: ${todo.percentage}%`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(todo)}>
                <Edit />
              </IconButton>
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(todo._id)}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Button variant="contained" color="primary" sx={{opacity:'0.9', marginTop:'4rem'}} fullWidth onClick={() => router.push('/')}>
        Go to HomePage
      </Button>
    </Container>
  );
};

export default AdminPanel;
