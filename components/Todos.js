import React from 'react';
import { Card, CardContent, Checkbox, Typography, Box, Skeleton } from '@mui/material';
import { useSpring, animated } from 'react-spring';
import { useRouter } from 'next/router';

// Function to generate a random, distinct pastel color
const getRandomPastelColor = (() => {
  // Cache for previous hues to ensure distinct colors
  let previousHue = null;

  return () => {
    // Function to ensure distinct hue by spacing it out from the previous one
    const getDistinctHue = () => {
      const hueStep = 30; // Ensure the hues are at least 30 degrees apart
      let hue = Math.floor(Math.random() * 360);
      if (previousHue !== null) {
        while (Math.abs(hue - previousHue) < hueStep) {
          hue = Math.floor(Math.random() * 360);
        }
      }
      previousHue = hue;
      return hue;
    };

    const hue = getDistinctHue();
    const saturation = 100 + Math.random() * 10; // Pastel saturation range: 70-80%
    const lightness = 90 + Math.random() * 5; // Pastel lightness range: 85-90%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Return the generated pastel color
  };
})();

const Todos = ({ todos, completedTodos, handleToggleTodo, isLoading }) => {
  const router = useRouter();
  const props = useSpring({ opacity: 1, from: { opacity: 0 }, config: { duration: 500 } });

  // Keywords that will trigger pastel coloring
  const highlightWords = [
    'read',
    'slept',
    'meditation',
    'vlog',
    'vocabulary',
    'Spectacles',
    'chant',
    'duolingo',
    'write',
    'videos',
    'reels',
    'managed'
  ]; 

  // Check if a todo's title contains any of the keywords (case-insensitive)
  const doesTodoContainWord = (title) => {
    return highlightWords.some((word) => title.toLowerCase().includes(word.toLowerCase()));
  };

  // Sort todos: unchecked todos appear before checked todos
  const sortedTodos = [...todos].sort((a, b) => {
    const isACompleted = completedTodos?.includes(a._id);
    const isBCompleted = completedTodos?.includes(b._id);
    return isACompleted - isBCompleted; // false (0) comes before true (1)
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '23rem', overflow: 'auto' }}>
      {isLoading ? (
        Array.from({ length: 20 }).map((_, index) => (
          <animated.div key={index} style={props}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Skeleton variant="text" width={100} />
                    <Skeleton variant="text" width={50} />
                  </Box>
                  <Skeleton variant="circular" width={40} height={40} />
                </Box>
              </CardContent>
            </Card>
          </animated.div>
        ))
      ) : (
        sortedTodos?.map((todo) => {
          const isHighlighted = doesTodoContainWord(todo.title);
          const randomPastelColor = isHighlighted ? getRandomPastelColor() : 'inherit';

          return (
            <animated.div key={todo._id} style={props}>
              <Card
                sx={{
                  backgroundColor: randomPastelColor, // Apply random pastel color if highlighted
                  transition: 'background-color 0.3s ease', // Smooth transition for color
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography className="pop" variant="h6">{todo.title}</Typography>
                      <Typography
                        className="pop"
                        variant="body2"
                        sx={{ color: completedTodos?.includes(todo._id) ? 'green' : 'gray' }}
                      >
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
          );
        })
      )}
    </Box>
  );
};

export default Todos;
