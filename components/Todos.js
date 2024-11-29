// components/Todos.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Checkbox,
  Typography,
  Box,
  Skeleton,
  TextField,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useSpring, animated } from 'react-spring';
import debounce from 'lodash/debounce';

// Function to generate a random pastel color
const generatePastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 10; // 70-80%
  const lightness = 80 + Math.random() * 10; // 80-90%
  return `hsl(${hue}, ${saturation}%, 90%)`;
};

// Memoize category colors to maintain consistency
const useCategoryColors = (todos) => {
  return useMemo(() => {
    const categoryColorMap = {};
    todos.forEach((todo) => {
      if (todo.category && !categoryColorMap[todo.category]) {
        categoryColorMap[todo.category] = generatePastelColor();
      }
    });
    return categoryColorMap;
  }, [todos]);
};

const Todos = ({ todos, completedTodos, handleToggleTodo, isLoading }) => {
  const props = useSpring({ opacity: 1, from: { opacity: 0 }, config: { duration: 500 } });
  const [searchTerm, setSearchTerm] = useState('');
  const [isGrouped, setIsGrouped] = useState(false); // New state for grouping

  // Generate consistent colors for categories
  const categoryColors = useCategoryColors(todos);

  // Debounced search handler to optimize performance
  const handleSearchChange = useCallback(
    debounce((event) => {
      setSearchTerm(event.target.value);
    }, 300),
    []
  );

  // Filter todos based on search term (case-insensitive)
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) =>
      todo.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [todos, searchTerm]);

  // Group filtered todos by category
  const groupedTodos = useMemo(() => {
    const groups = {};
    filteredTodos.forEach((todo) => {
      const category = todo.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(todo);
    });
    return groups;
  }, [filteredTodos]);

  // Get sorted category names
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedTodos).sort();
  }, [groupedTodos]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Search Bar and Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          label="Search Todos"
          variant="outlined"
          fullWidth
          onChange={handleSearchChange}
          sx={{ marginBottom: 2, flex: 1, mr: 2 }}
        />

      </Box>

      {/* Todo List */}
      <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 10 }).map((_, index) => (
              <animated.div key={index} style={props}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Skeleton variant="text" width={150} height={30} />
                        <Skeleton variant="text" width={100} height={20} />
                      </Box>
                      <Skeleton variant="circular" width={40} height={40} />
                    </Box>
                  </CardContent>
                </Card>
              </animated.div>
            ))
          ) : isGrouped ? (
            // Grouped View
            sortedCategories.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No todos found.
              </Typography>
            ) : (
              sortedCategories.map((category) => (
                <Box key={category}>
                  {/* Category Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={category}
                      color="secondary"
                      variant="filled"
                      size="medium"
                      sx={{
                        fontSize: '1rem',
                        backgroundColor: 'rgb(250, 250, 250)',
                        color: 'black',
                      }}
                    />
                  </Box>
                  {/* Todos Under Category */}
                  {groupedTodos[category].map((todo) => {
                    const isCompleted = completedTodos.includes(todo._id);
                    const backgroundColor = todo.isColorful ? categoryColors[todo.category] : 'inherit';

                    return (
                      <animated.div key={todo._id} style={props}>
                        <Card
                          sx={{
                            backgroundColor: backgroundColor,
                            transition: 'background-color 0.3s ease',
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {/* Todo Title and Checkbox */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 500,
                                      wordBreak: 'break-word',
                                      textDecoration: isCompleted ? 'line-through' : 'none',
                                      color: isCompleted ? 'text.secondary' : 'text.primary',
                                    }}
                                  >
                                    {todo.title}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: isCompleted ? 'green' : 'gray',
                                    }}
                                  >
                                    {(todo.percentage * 100).toFixed(2)}%
                                  </Typography>
                                </Box>
                                <Checkbox
                                  checked={isCompleted}
                                  onChange={() => handleToggleTodo(todo._id)}
                                  color="primary"
                                />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </animated.div>
                    );
                  })}
                </Box>
              ))
            )
          ) : filteredTodos.length === 0 ? (
            // No Todos Found
            <Typography variant="body1" color="text.secondary">
              No todos found.
            </Typography>
          ) : (
            // Ungrouped View: Render Todos in Order
            filteredTodos.map((todo) => {
              const isCompleted = completedTodos.includes(todo._id);
              const backgroundColor = todo.isColorful ? categoryColors[todo.category] : 'inherit';

              return (
                <animated.div key={todo._id} style={props}>
                  <Card
                    sx={{
                      backgroundColor: backgroundColor,
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Category Chip */}
                        {todo.category && (
                          <Chip
                            label={todo.category}
                            // color="secondary"
                            variant="filled"
                            size="small"
                            sx={{
                              alignSelf: 'flex-start',
                              // fontWeight: 'bold',
                              fontSize: '0.875rem',
                              backgroundColor: 'rgb(250, 250, 250)', 
                            }}
                          />
                        )}

                        {/* Todo Title and Checkbox */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 500,
                                wordBreak: 'break-word',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                color: isCompleted ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {todo.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: isCompleted ? 'green' : 'gray',
                              }}
                            >
                              {(todo.percentage * 100).toFixed(2)}%
                            </Typography>
                          </Box>
                          <Checkbox
                            checked={isCompleted}
                            onChange={() => handleToggleTodo(todo._id)}
                            color="primary"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </animated.div>
              );
            })
          )}
        </Box>
      </Box>

      <FormControlLabel
            sx={{mt:5}}

          control={
            <Switch
              checked={isGrouped}
              onChange={() => setIsGrouped((prev) => !prev)}
              color="primary"
            />
          }
          label="Group By Category"
        />
    </Box>
  );
};

export default Todos;
