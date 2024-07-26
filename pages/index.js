import { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { differenceInDays } from 'date-fns';
import Quote from '../components/Quote';
import TotalCompletion from '../components/TotalCompletion';
import Todos from '../components/Todos';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';
import DailyCompletion from '@/components/DailyCompletion';
import Dashboard from '@/components/Dashboard';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

const quotes = [
  "Who I was yesterday is not who I am today, and who I am today will not be who I am tomorrow"
];

const startDate = new Date('2024-07-23');

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [dailyPercentage, setDailyPercentage] = useState(0);
  const [quote, setQuote] = useState('');
  const [totalCompletion, setTotalCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const router = useRouter();

  useEffect(() => {
    fetchTodos();
    fetchDailyCompletion();
    fetchTotalCompletion();
    setRandomQuote();
  }, []);

  const fetchTodos = async () => {
    setIsLoading(true);
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data);
    setIsLoading(false);
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
    <Container className={styles.homeContainer} maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <TotalCompletion percentageProp={totalCompletion} datestring={dateString} />
        <Quote text={quote} />
        <Box>
          <DailyCompletion percentageProp={dailyPercentage} />
        </Box>
        <Todos todos={todos} completedTodos={completedTodos} handleToggleTodo={handleToggleTodo} isLoading={isLoading} />
      </Box>
      <Dashboard currentPage={'home'} />
    </Container>
  );
};

export default Home;
