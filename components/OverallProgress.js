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
import { format, parseISO } from 'date-fns'; // Import parseISO for parsing date strings

const OverallProgress = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/overall-progress');
        const data = await response.json();
        setData(data);
      } catch (error) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography variant="h4" gutterBottom>
          Overall Progress
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
        <Typography variant="h4" gutterBottom>
          Overall Progress
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

  // Helper function to format dates
  const formatXAxis = (tickItem) => {
    const date = parseISO(tickItem); // Ensure tickItem is parsed as a date
    return format(date, 'MMM dd');
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ marginBottom: '2rem' }}>
        Overall Progress
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
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

export default OverallProgress;
