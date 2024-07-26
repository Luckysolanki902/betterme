import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Container, Typography, Paper, CircularProgress, useTheme, Box } from '@mui/material';

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
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Paper sx={{
          padding: theme.spacing(3),
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <CircularProgress color="primary" />
          <Typography variant="h6" sx={{ marginTop: theme.spacing(2) }}>
            Loading...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Paper sx={{
          padding: theme.spacing(3),
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">

        <Typography variant="h4" gutterBottom>
          Overall Progress
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="date" tick={{ fontSize: '12px' }} />
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
