// components/OverallProgress.js

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Container, Typography, Paper, CircularProgress } from '@mui/material';

const OverallProgress = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <Container>
        <Paper style={{ padding: 16, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" style={{ marginTop: 16 }}>
            Loading...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Paper style={{ padding: 16, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container>
      <Paper style={{ padding: 16 }}>
        <Typography variant="h5" gutterBottom>
          Overall Progress
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Line type="monotone" dataKey="percentage" stroke="#8884d8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  );
};

export default OverallProgress;
