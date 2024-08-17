import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  FormControlLabel,
  Typography,
  CircularProgress,
  Grid,
  Container,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import CountUp from 'react-countup';
import axios from 'axios';

const CompletionCounts = () => {
  const [data, setData] = useState([]);
  const [todos, setTodos] = useState([]);
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Default selection array
  const defaultSelection = ['exercise', 'meditation', 'celibacy', 'dsa', 'webd', 'read a book', 'handstand practice', 'read trueself'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch completion counts
        const response = await axios.get('/api/completion-counts');
        setData(response.data);

        // Fetch todos for filtering options
        const todosResponse = await axios.get('/api/todos');
        setTodos(todosResponse.data);

        // Set default selected todos based on defaultSelection array
        const defaultTodoIds = todosResponse.data
          .filter(todo => defaultSelection.includes(todo.title.toLowerCase()))
          .map(todo => todo._id.toString());

        setSelectedTodos(defaultTodoIds);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleTodo = (todoId) => {
    setSelectedTodos((prev) =>
      prev.includes(todoId) ? prev.filter(id => id !== todoId) : [...prev, todoId]
    );
  };

  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  const filteredData = data.filter(item => selectedTodos.includes(item.id));

  const truncateTitle = (title, maxLength = 12) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  // Aggregate counts for selected todos
  const aggregatedCounts = filteredData.reduce((acc, item) => {
    acc[item.title] = (acc[item.title] || 0) + item.completionCount;
    return acc;
  }, {});

  return (
    <Box sx={{ padding: 4 }}>
      <Box  sx={{display:'flex', justifyContent:'space-between'}}>

        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
          Todo Counts
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleDialogOpen}
          sx={{ mb: 4 }}
        >
          Filter
        </Button>

      </Box>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select Todos to Display</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {todos.map((todo) => (
              <Grid item xs={12} key={todo._id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedTodos.includes(todo._id.toString())}
                      onChange={() => handleToggleTodo(todo._id.toString())}
                    />
                  }
                  label={todo.title}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Container>
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {Object.keys(aggregatedCounts).length === 0 ? (
            <Typography>No data available</Typography>
          ) : (
            Object.entries(aggregatedCounts).map(([title, count]) => (
              <Grid item xs={6} sm={6} key={title}>
                <Card>
                  <CardHeader
                    title={
                      <Typography
                        noWrap
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center'
                        }}
                      >
                        {truncateTitle(title)}
                      </Typography>
                    }
                    sx={{ backgroundColor: (theme) => theme.palette.primary.main, color: 'white', opacity: '0.9' }}
                  />
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" component="div">
                      <CountUp
                        start={0}
                        end={count}
                        duration={1.5}
                        separator=","
                        decimals={0}
                      />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default CompletionCounts;
