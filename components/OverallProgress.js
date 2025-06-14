// components/OverallProgress.js
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
import { format, parseISO, differenceInDays, eachDayOfInterval } from 'date-fns';
import { useStartDate } from '@/contexts/StartDateContext'; // Import the useStartDate hook

const OverallProgress = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });
  const theme = useTheme();
  const startDateContext = useStartDate(); // Get start date from context
  const isSmallScreen = useMediaQuery('(max-width: 600px)');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/overall-progress');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const rawData = await response.json();

        // Fill missing dates using startDate from context
        const filledData = fillMissingDates(rawData);
        // Calculate cumulative data after filling missing dates
        const cumulativeData = calculateCumulativeData(filledData);
        setData(cumulativeData);
        setStatus({ loading: false, error: null });
      } catch (error) {
        console.error('Error fetching data:', error);
        setStatus({ loading: false, error: 'Failed to fetch data' });
      }
    };

    fetchData();
    // Re-fetch data if startDateContext changes
  }, [startDateContext]);

  // Function to fill missing dates with 0 score data and ensure the range extends to today
  const fillMissingDates = (apiData) => {
    if (apiData.length === 0) return [];

    // Determine the actual start date from context or API data
    let actualStartDate;
    if (startDateContext) {
      actualStartDate =
        typeof startDateContext === 'string' ? parseISO(startDateContext) : startDateContext;
    } else {
      // Fallback to the earliest date in API data if context is not available
      actualStartDate = parseISO(apiData[0].date);
    }

    const today = new Date(); // Today's date

    // Generate all dates between the start date and today's date
    const allDates = eachDayOfInterval({ start: actualStartDate, end: today });

    // Create a map for quick lookup of API data by date
    const dataMap = new Map();
    apiData.forEach((item) => {
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
      
      return {
        date: formattedDate,
        score: dayData.score,
        totalPossibleScore: dayData.totalPossibleScore,
        // Calculate improvement percentage for the day
        improvement: dayData.totalPossibleScore > 0 ? (dayData.score / dayData.totalPossibleScore) * 100 : 0,
      };
    });

    return filledData;
  };

  // Function to calculate cumulative score and improvement
  const calculateCumulativeData = (filledData) => {
    let cumulativeScore = 0;
    let cumulativeTotalPossible = 0;
    return filledData.map((item) => {
      cumulativeScore += item.score;
      cumulativeTotalPossible += item.totalPossibleScore;
      
      const cumulativeImprovement = cumulativeTotalPossible > 0 
        ? (cumulativeScore / cumulativeTotalPossible) * 100 
        : 0;
        
      return {
        ...item,
        cumulativeScore,
        cumulativeTotalPossible,
        cumulativeImprovement: parseFloat(cumulativeImprovement.toFixed(2)),
      };
    });
  };

  // Function to determine Y-axis domain based on data
  const getYAxisDomain = () => {
    const maxValue = Math.max(...data.map((item) => item.cumulativeImprovement), 0);
    return Math.ceil(maxValue / 10) * 10 || 10; // Ensure at least 10
  };

  // Helper function to format dates on the X-axis
  const formatXAxis = (tickItem) => {
    const date = parseISO(tickItem);
    return format(date, 'MMM dd');
  };

  // Calculate the number of days since start date
  const today = new Date();
  const dayCount = 
    differenceInDays(today, startDateContext) + 1


  // Render loading or error states
  const renderContent = () => {
    if (status.loading) {
      return <Typography variant="h6">Loading...</Typography>;
    }

    if (status.error) {
      return <Typography variant="h6">{status.error}</Typography>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: '12px' }}
            tickFormatter={formatXAxis}
            minTickGap={20}
          />
          <YAxis
            domain={[0, getYAxisDomain()]} // Set Y-axis domain
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: '12px' }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'cumulativeImprovement') return `${value}%`;
              return value;
            }}
            labelFormatter={(label) => formatXAxis(label)}
            contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '8px' }}
          />
          <Line
            type="monotone" // Smooth line
            dataKey="cumulativeImprovement"
            name="Improvement"
            stroke={theme.palette.primary.main}
            dot={false} // Remove dots for cleaner graph
            strokeWidth={2}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ padding: '1rem 0' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography className='pop' variant="h4" sx={{ marginBottom: '1rem' }}>
          Overall Progress
        </Typography>
        <Typography className='pop' variant="h4" gutterBottom sx={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
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
