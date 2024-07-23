import React from 'react';
import { Card, CardContent, CardActions, Button, Checkbox, Typography, Box } from '@mui/material';
import { useSpring, animated } from 'react-spring';
import { useRouter } from 'next/router';

const Todos = ({ todos, completedTodos, handleToggleTodo }) => {
  const router = useRouter();
  const props = useSpring({ opacity: 1, from: { opacity: 0 }, config: { duration: 500 } });

  // Sort todos: unchecked todos appear before checked todos
  const sortedTodos = [...todos].sort((a, b) => {
    const isACompleted = completedTodos?.includes(a._id);
    const isBCompleted = completedTodos?.includes(b._id);
    return isACompleted - isBCompleted; // false (0) comes before true (1)
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight:'23rem', overflow: 'auto' }}>
      {sortedTodos?.map((todo) => (
        <animated.div key={todo._id} style={props}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography className='pop' variant="h6">{todo.title}</Typography>
                  <Typography className='pop' variant="body2" sx={{ color: completedTodos?.includes(todo._id) ? 'green' : 'gray' }}>
                    {todo.percentage}%
                  </Typography>
                </Box>
                <Checkbox
                  checked={completedTodos?.includes(todo._id)}
                  onChange={() => handleToggleTodo(todo._id)}
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