// pages/modify/index.js
import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, List, Paper, Divider, 
  Skeleton, Alert, Fab, Dialog, useTheme, useMediaQuery
} from '@mui/material';
import Layout from '../../components/Layout';
import TodoListItem from '../../components/TodoListItem';
import EmptyState from '../../components/EmptyState';
import ModifyTodosNew from '../../components/ModifyTodosNew';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const AdminPanel = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/todos');
      setTodos(res.data);
    } catch (err) {
      setError('Error fetching todos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setOpenDialog(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await axios.delete(`/api/todos/${id}`);
        fetchTodos();
      } catch (err) {
        setError('Error deleting todo. Please try again.');
      }
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingTodo(null);
    fetchTodos(); // Refresh the list after any changes
  };

  const handleAddNew = () => {
    setEditingTodo(null);
    setOpenDialog(true);
  };

  const totalTodos = todos.length;
  const totalScore = todos.reduce((sum, todo) => sum + todo.score, 0);
  const averageScore = totalTodos ? (totalScore / totalTodos).toFixed(1) : 0;  
  return (
    <Layout>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Manage Tasks
      </Typography>
      
      {/* Statistics */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Task Statistics
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ textAlign: 'center', p: 1, minWidth: '100px' }}>
            <Typography variant="h5" color="primary">
              {totalTodos}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tasks
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

      {/* Task List */}
      <Paper elevation={1} sx={{ p: 3, position: 'relative' }}>
        <Typography variant="h6" gutterBottom>
          Task List
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
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

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="add"
        onClick={handleAddNew}
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3B4CCA 0%, #8357C5 100%)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <AddIcon />
      </Fab>      {/* Modern Add/Edit Dialog */}      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <ModifyTodosNew
          open={openDialog}
          onClose={handleDialogClose}
          editingTodo={editingTodo}
          todos={todos}
        />
      </Dialog>
    </Layout>
  );
};

export default AdminPanel;
