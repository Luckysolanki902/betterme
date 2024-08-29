import { useState, useEffect } from 'react';
import { Container, Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Quote from '@/components/Quote';
import TotalCompletion from '@/components/TotalCompletion';
import DailyCompletion from '@/components/DailyCompletion';
import Todos from '@/components/Todos';
import Dashboard from '@/components/Dashboard';
import { useStartDate } from '@/contexts/StartDateContext';
import styles from '@/styles/Home.module.css';

const quotes = [
    "Who I was yesterday is not who I am today, and who I am today will not be who I am tomorrow"
];

const History = () => {
    const [todos, setTodos] = useState([]);
    const [completedTodos, setCompletedTodos] = useState([]);
    const [dailyPercentage, setDailyPercentage] = useState(0);
    const [quote, setQuote] = useState('');
    const [totalCompletion, setTotalCompletion] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs()); // Ensure it's Dayjs or null
    const startDate = useStartDate();

    useEffect(() => {
        fetchTodos();
        fetchDailyCompletion();
        fetchTotalCompletion();
        setRandomQuote();
    }, [selectedDate]);

    const fetchTodos = async () => {
        setIsLoading(true);
        const res = await fetch('/api/todos');
        const data = await res.json();
        setTodos(data);
        setIsLoading(false);
    };

    const fetchDailyCompletion = async () => {
        if (!selectedDate) return; // Handle null value
        const formattedDate = selectedDate.format('YYYY-MM-DD');
        const res = await fetch(`/api/daily-completion?date=${formattedDate}`);
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
        if (!selectedDate) return; // Handle null value
        await fetch('/api/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ todoId, date: selectedDate.format('YYYY-MM-DD') }),
        });
        fetchDailyCompletion();
        fetchTotalCompletion();
    };

    const today = dayjs();
    const dayCount = selectedDate ? selectedDate.diff(dayjs(startDate), 'day') + 1 : 0; // Handle null value
    const dateString = `Day ${dayCount}`;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container className={styles.homeContainer} maxWidth="md">
                <Box sx={{ mb: 4 }}>
                    <DatePicker
                        label="Select Date"
                        value={selectedDate}
                        onChange={(newValue) => setSelectedDate(newValue)}
                        minDate={dayjs(startDate)}
                        maxDate={today}
                        renderInput={(params) => <TextField {...params} />}
                    />
                    <TotalCompletion percentageProp={totalCompletion} datestring={dateString} />
                    <Quote text={quote} />
                    <Box>
                        <DailyCompletion percentageProp={dailyPercentage} />
                    </Box>
                    <Todos todos={todos} completedTodos={completedTodos} handleToggleTodo={handleToggleTodo} isLoading={isLoading} />
                </Box>
                <Dashboard currentPage={'history'} />
            </Container>
        </LocalizationProvider>
    );
};

export default History;
