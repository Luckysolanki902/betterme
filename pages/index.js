import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { differenceInDays } from 'date-fns';
import Quote from '../components/Quote';
import TotalCompletion from '../components/TotalCompletion';
import Todos from '../components/Todos';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';
import DailyCompletion from '@/components/DailyCompletion';

const quotes = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "A little progress each day adds up to big results.",
  "The journey of a thousand miles begins with one step.",
  "Consistency is what transforms average into excellence."
];

const startDate = new Date('2024-07-23');

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [dailyPercentage, setDailyPercentage] = useState(0);
  const [quote, setQuote] = useState('');
  const [totalCompletion, setTotalCompletion] = useState(0);
  const router = useRouter()
  useEffect(() => {
    fetchTodos();
    fetchDailyCompletion();
    fetchTotalCompletion();
    setRandomQuote();
  }, []);

  const fetchTodos = async () => {
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data);
  };

  const fetchDailyCompletion = async () => {
    const res = await fetch('/api/daily-completion');
    const data = await res.json();
    setCompletedTodos(data.completedTodos);
    setDailyPercentage(data.percentage);
  };

  const fetchTotalCompletion = async () => {
    const res = await fetch('/api/total-completion');
    const data = await res.json();
    setTotalCompletion(data.totalPercentage);
  };

  const setRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  };

  const handleToggleTodo = async (todoId) => {
    await fetch('/api/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ todoId }),
    });
    fetchDailyCompletion();
    fetchTotalCompletion();
  };

  const today = new Date();
  const dayCount = differenceInDays(today, startDate) + 1;
  const dateString = `Day ${dayCount}`;

  return (
    <Container className={styles.homeContainer} maxWidth="md" >
      <Box sx={{ mb: 4 }}>
        <TotalCompletion percentageProp={totalCompletion} datestring={dateString}  />
          <Quote text={quote} />
        <Box>
        <DailyCompletion percentageProp={dailyPercentage}/>

         </Box>
      <Todos todos={todos} completedTodos={completedTodos} handleToggleTodo={handleToggleTodo}  />
      </Box>
      <Button  variant="contained" color="primary" fullWidth sx={{marginTop:'2rem'}} onClick={() => router.push('/admin')}>
        Add More or Edit
      </Button>
    </Container>
  );
};

export default Home;
