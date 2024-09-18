import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Container, Typography, Box, useTheme } from '@mui/material';
import { format, parseISO, eachDayOfInterval, isAfter } from 'date-fns'; // Import necessary date-fns functions

const DailyProgress = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/overall-progress');
        const apiData = await response.json();
        
        // Fill missing dates, including up to today
        const filledData = fillMissingDates(apiData);
        setData(filledData);
      } catch (error) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to fill missing dates with 0% data and ensure the range extends to today
  const fillMissingDates = (apiData) => {
    if (apiData.length === 0) return [];
    
    // Sort the API data by date
    const sortedData = apiData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get the first date from the data and today's date
    const startDate = parseISO(sortedData[0].date);
    const today = new Date(); // Today's date

    // Generate all dates between the first date and today's date
    const allDates = eachDayOfInterval({ start: startDate, end: today });

    // Create a map for quick lookup of API data by date
    const dataMap = new Map();
    sortedData.forEach(item => {
      const formattedDate = format(parseISO(item.date), 'yyyy-MM-dd');
      dataMap.set(formattedDate, item.percentage);
    });

    // Fill missing dates with 0% for days not in the API data
    const filledData = allDates.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      return {
        date: formattedDate,
        percentage: dataMap.has(formattedDate) ? dataMap.get(formattedDate) : 0,
      };
    });

    return filledData;
  };

  if (loading) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography className='pop' variant="h4" gutterBottom>
          Daily Progress
        </Typography>
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Typography variant="h6">Loading...</Typography>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography className='pop' variant="h4" gutterBottom>
          Daily Progress
        </Typography>
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Typography variant="h6">Some Error Occurred</Typography>
        </Container>
      </Box>
    );
  }

  // Helper function to format dates on the X-axis
  const formatXAxis = (tickItem) => {
    const date = parseISO(tickItem); // Ensure tickItem is parsed as a date
    return format(date, 'MMM dd');
  };

  return (
    <Container maxWidth="lg">
      <Typography className='pop' variant="h4" sx={{ marginBottom: '1rem' }}>
        Daily Progress
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="date" tick={{ fontSize: '12px' }} tickFormatter={formatXAxis} />
          <YAxis
            domain={[0, 2]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: '12px' }}
          />
          <Tooltip formatter={(value) => `${value}%`} />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke={theme.palette.primary.main}
            dot={{ stroke: theme.palette.primary.main, strokeWidth: 2 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Container>
  );
};

export default DailyProgress;
