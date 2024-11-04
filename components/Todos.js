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
  Divider,
} from '@mui/material';
import { useSpring, animated } from 'react-spring';
import debounce from 'lodash/debounce';

// Function to generate a random pastel color
const generatePastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 10; // 70-80%
  const lightness = 80 + Math.random() * 10; // 80-90%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const Todos = ({ todos, completedTodos, handleToggleTodo, isLoading }) => {
  const props = useSpring({ opacity: 1, from: { opacity: 0 }, config: { duration: 500 } });
  const [searchTerm, setSearchTerm] = useState('');

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
      {/* Search Bar */}
      <TextField
        label="Search Todos"
        variant="outlined"
        fullWidth
        onChange={handleSearchChange}
        sx={{ marginBottom: 2 }}
      />

      {/* Todo List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
        ) : sortedCategories.length === 0 ? (
          // No Todos Found
          <Typography variant="body1" color="text.secondary">
            No todos found.
          </Typography>
        ) : (
          // Render Todos Grouped by Category
          sortedCategories.map((category) => (
            <Box key={category}>
              {/* Category Header */}
              <Typography
                variant="h6"
                sx={{
                  marginBottom: 1,
                  color: 'black', // MUI primary color shade
                }}
              >
                {category}
              </Typography>
              <Divider sx={{ marginBottom: 2 }} />

              {/* Todos Under Category */}
              {groupedTodos[category].map((todo) => {
                const isCompleted = completedTodos.includes(todo._id);
                const backgroundColor = todo.isColorful ? generatePastelColor() : 'inherit';

                return (
                  <animated.div key={todo._id} style={props}>
                    <Card
                      sx={{
                        backgroundColor: backgroundColor,
                        transition: 'background-color 0.3s ease',
                        marginBottom:'2rem',
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 500,
                                wordBreak: 'break-word',
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
                      </CardContent>
                    </Card>
                  </animated.div>
                );
              })}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Todos;
