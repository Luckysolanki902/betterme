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
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { Container, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useStartDate } from '@/contexts/StartDateContext';

const OverallProgress = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });
  const theme = useTheme();
  const startDate = useStartDate();
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/overall-progress');
        const rawData = await response.json();
        const cumulativeData = calculateCumulativeData(rawData);
        setData(cumulativeData);
        setStatus({ loading: false, error: null });
      } catch (error) {
        setStatus({ loading: false, error: 'Failed to fetch data' });
      }
    };

    fetchData();
  }, []);

  const calculateCumulativeData = (rawData) => {
    let cumulativePercentage = 0;
    return rawData.map((item) => {
      cumulativePercentage += item.percentage;
      return {
        ...item,
        cumulativePercentage: parseFloat(cumulativePercentage.toFixed(2)), // Round to 2 decimal places
      };
    });
  };

  const getYAxisDomain = () => {
    const maxValue = Math.max(...data.map((item) => item.cumulativePercentage));
    return Math.ceil(maxValue * 2) / 2; // Rounds up to the next multiple of 0.5
  };

  const formatXAxis = (tickItem) => {
    const date = parseISO(tickItem);
    return format(date, 'MMM dd');
  };

  const todayD = new Date();
  const dayCount = differenceInDays(todayD, startDate) + 1;

  const renderContent = () => {
    if (status.loading) {
      return <Typography variant="h6">Loading...</Typography>;
    }

    if (status.error) {
      return <Typography variant="h6">Some Error Occurred</Typography>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="date" tick={{ fontSize: '12px' }} tickFormatter={formatXAxis} />
          <YAxis
            domain={[0, getYAxisDomain()]} // Set Y-axis domain
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: '12px' }}
          />
          <Tooltip formatter={(value) => `${value}%`} />
          <Line
            type="monotone"
            dataKey="cumulativePercentage"
            stroke={theme.palette.primary.main}
            dot={{ stroke: theme.palette.primary.main, strokeWidth: 2 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: !isSmallScreen ? '0 0rem' : '0' }}>
        <Typography className='pop' variant="h4" sx={{ marginBottom: '1rem' }}>
          Overall Progress
        </Typography>
        <Typography className='pop' variant="h3" gutterBottom sx={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
          <LocalFireDepartmentIcon sx={{ fontSize: '3rem', color: '#f57f17' }} />
          {dayCount}
        </Typography>
      </Box>
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        {renderContent()}
      </Container>
    </Box>
  );
};

export default OverallProgress;

