import React, { useState } from 'react';
import { Card, CardContent, Checkbox, Typography, Box } from '@mui/material';
import { useSpring, animated } from 'react-spring';

const Todos = ({ todos, completedTodos, handleToggleTodo }) => {
  const [localCompletedTodos, setLocalCompletedTodos] = useState(completedTodos || []);
  const props = useSpring({ opacity: 1, from: { opacity: 0 }, config: { duration: 500 } });

  // Sort todos: unchecked todos appear before checked todos
  const sortedTodos = [...todos].sort((a, b) => {
    const isACompleted = localCompletedTodos.includes(a._id);
    const isBCompleted = localCompletedTodos.includes(b._id);
    return isACompleted - isBCompleted; // false (0) comes before true (1)
  });

  const handleChange = async (todoId) => {
    // Optimistically update the local state
    const newCompletedTodos = localCompletedTodos.includes(todoId)
      ? localCompletedTodos.filter(id => id !== todoId)
      : [...localCompletedTodos, todoId];

    setLocalCompletedTodos(newCompletedTodos);

    try {
      // Update the backend
      await handleToggleTodo(todoId);
    } catch (error) {
      // Revert the local state if the backend update fails
      setLocalCompletedTodos(completedTodos || []);
      console.error('Failed to update todo:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '23rem', overflow: 'auto' }}>
      {sortedTodos?.map((todo) => (
        <animated.div key={todo._id} style={props}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography className='pop' variant="h6">{todo.title}</Typography>
                  <Typography className='pop' variant="body2" sx={{ color: localCompletedTodos.includes(todo._id) ? 'green' : 'gray' }}>
                    {todo.percentage}%
                  </Typography>
                </Box>
                <Checkbox
                  checked={localCompletedTodos.includes(todo._id)}
                  onChange={() => handleChange(todo._id)}
                />
              </Box>
            </CardContent>
          </Card>
        </animated.div>
      ))}
    </Box>
  );
};

export default Todos;
