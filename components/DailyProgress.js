// components/DailyProgress.js
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
import { format, parseISO, eachDayOfInterval } from 'date-fns'; // Import necessary date-fns functions
import { useStartDate } from '@/contexts/StartDateContext'; // Import the useStartDate hook

const DailyProgress = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  // Use startDate from StartDateContext
  const startDateContext = useStartDate(); // Assuming it returns a Date object or a parseable string
  let startDate;

  // Validate and parse startDate from context
  if (startDateContext) {
    startDate = typeof startDateContext === 'string' ? parseISO(startDateContext) : startDateContext;
  } else {
    // Fallback to the earliest date in data if context is not available
    startDate = null;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/overall-progress');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const apiData = await response.json();

        // Fill missing dates, including up to today
        const filledData = fillMissingDates(apiData);
        setData(filledData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateContext]); // Re-fetch data if startDateContext changes

  // Function to fill missing dates with 0 score data and ensure the range extends to today
  const fillMissingDates = (apiData) => {
    if (apiData.length === 0) return [];

    // Sort the API data by date
    const sortedData = apiData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Determine the actual start date
    const actualStartDate = startDate ? startDate : parseISO(sortedData[0].date);

    const today = new Date(); // Today's date

    // Generate all dates between the start date and today's date
    const allDates = eachDayOfInterval({ start: actualStartDate, end: today });

    // Create a map for quick lookup of API data by date
    const dataMap = new Map();
    sortedData.forEach((item) => {
      const formattedDate = format(parseISO(item.date), 'yyyy-MM-dd');
      dataMap.set(formattedDate, {
        score: item.score || 0,
        totalPossibleScore: item.totalPossibleScore || 0
      });
    });

    // Fill missing dates with 0 for days not in the API data
    const filledData = allDates.map((date) => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayData = dataMap.has(formattedDate) ? dataMap.get(formattedDate) : { score: 0, totalPossibleScore: 0 };
      
      // Calculate daily improvement percentage
      const dailyImprovement = dayData.totalPossibleScore > 0 
        ? (dayData.score / dayData.totalPossibleScore) * 100 
        : 0;
      
      return {
        date: formattedDate,
        score: dayData.score,
        totalPossibleScore: dayData.totalPossibleScore,
        improvement: parseFloat(dailyImprovement.toFixed(1))
      };
    });

    return filledData;
  };

  if (loading) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography className="pop" variant="h4" gutterBottom>
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
        <Typography className="pop" variant="h4" gutterBottom>
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
          <Typography variant="h6">{error}</Typography>
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
      <Typography className="pop" variant="h4" sx={{ marginBottom: '1rem' }}>
        Daily Progress
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: '12px' }}
            tickFormatter={formatXAxis}
            minTickGap={20}
          />
          <YAxis
            domain={[0, 'dataMax + 10']}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'improvement') return `${value}%`;
              return value;
            }} 
            labelFormatter={(label) => formatXAxis(label)}
            contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }}
          />
          <Line
            type="monotone"
            dataKey="improvement"
            name="Daily Improvement"
            stroke={theme.palette.primary.main}
            dot={{ strokeWidth: 2, r: 4 }} // Add small dots for daily view
            strokeWidth={2}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Container>
  );
};

export default DailyProgress;
