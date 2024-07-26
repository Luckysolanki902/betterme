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
  useMediaQuery,
  useTheme,
  Container
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import axios from 'axios';

const CompletionCounts = () => {
  const [data, setData] = useState([]);
  const [todos, setTodos] = useState([]);
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Default selection array
  const defaultSelection = ['exercise', 'yoga', 'meditation'];

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

  // Calculate the max value in the filtered data to determine the domain
  const maxCompletionCount = Math.max(...filteredData.map(item => item.completionCount), 0);
  const yAxisDomain = [0, Math.ceil(maxCompletionCount / 10) * 10]; // Make the max value a multiple of 10

  return (
    <Box sx={{ padding: 2 }}>
      <Typography className='pop' variant="h4" gutterBottom>
        Todo Counts
      </Typography>
      <Button
        variant="outlined" 
        onClick={handleDialogOpen}
        sx={{ mb: 2 }}
      >
        Filter Todos
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select Todos to Display</DialogTitle>
        <DialogContent
          dividers
        >
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
          <Typography variant="h6" sx={{ marginTop: theme.spacing(2) }}>
            Loading...
          </Typography>
        </Container>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BarChart
            width={isSmallScreen ? 350 : 800}
            height={isSmallScreen ? 300 : 400}
            data={filteredData}
            margin={{ top: 20, right: 20, bottom: 20, left: -20 }} // Increased bottom margin for rotated labels
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="title"
              angle={-45} // Rotate labels
              textAnchor="end" // Align rotated labels to end
              style={{ fontSize: '12px' }} // Adjust font size if needed
            />
            <YAxis
              tickFormatter={(tick) => tick} // Display integer values directly
              domain={yAxisDomain} // Set domain to multiples of 10
              tickCount={Math.max(5, Math.ceil(maxCompletionCount / 10) + 1)} // Ensure enough ticks to display integers
            />
            <Tooltip />
            <Bar dataKey="completionCount" fill="#8884d8">
              <LabelList dataKey="completionCount" position="top" />
            </Bar>
          </BarChart>
        </div>
      )}
    </Box>
  );
};

export default CompletionCounts;
