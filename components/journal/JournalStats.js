// components/journal/JournalStats.js
import React from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import CountUp from 'react-countup';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './JournalStyles.module.css';
import MoodDisplay from './MoodDisplay';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Stats card for journal metrics
const StatCard = ({ value, label, color }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={3}
      className={styles.statCard}
      sx={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '25px',
        width: '100%', 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: `0 8px 30px ${alpha(color, 0.18)}`,
        border: `1px solid ${alpha(color, 0.25)}`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-7px) scale(1.03)',
          boxShadow: `0 12px 40px ${alpha(color, 0.35)}`,
          border: `1px solid ${alpha(color, 0.5)}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.7)})`,
          borderRadius: '5px 5px 0 0',
        },
        animation: 'fadeInUp 0.6s ease-out',
        '@keyframes fadeInUp': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Box 
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: alpha(color, 0.08),
          zIndex: 0
        }}
      />
      <Typography 
        variant="body2" 
        className={styles.statLabel}
        sx={{
          fontWeight: 500,
          color: theme.palette.text.secondary,
          mb: 1,
          position: 'relative',
          zIndex: 1
        }}
      >
        {label}
      </Typography>
      <Typography 
        variant="h4" 
        className={styles.statValue} 
        sx={{ 
          color,
          fontWeight: 700,
          position: 'relative',
          zIndex: 1
        }}
      >
        <CountUp end={value} duration={2} />
      </Typography>
    </Paper>
  );
};

// Journal statistics component
const JournalStats = ({ stats }) => {
  const theme = useTheme();
  // Ensure stats has default values and is not undefined
  const safeStats = stats || {};
  const {
    totalEntries = 0,
    currentStreak = 0,
    longestStreak = 0,
    totalWords = 0,
    avgWordsPerEntry = 0,
    mostCommonMood = { label: 'neutral', score: 5 },
    moodCounts = { neutral: { count: 0, score: 5 } }
  } = safeStats;
  // Get mood color based on mood score
  const getMoodColor = (score) => {
    if (score >= 8) return theme.palette.success.main; // Happy/Excited
    if (score >= 6) return theme.palette.info.main; // Positive
    if (score >= 4) return theme.palette.warning.main; // Neutral
    return theme.palette.error.main; // Negative
  };

  // Prepare chart data
  const chartData = {
    labels: Object.keys(moodCounts),
    datasets: [
      {
        data: Object.values(moodCounts).map(mood => mood.count || 0),
        backgroundColor: [
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.info.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.error.main, 0.8),
          alpha(theme.palette.secondary.main, 0.8),
          alpha(theme.palette.primary.main, 0.8),
        ],
        borderColor: [
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.secondary.main,
          theme.palette.primary.main,
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          alpha(theme.palette.success.main, 0.9),
          alpha(theme.palette.info.main, 0.9),
          alpha(theme.palette.warning.main, 0.9),
          alpha(theme.palette.error.main, 0.9),
          alpha(theme.palette.secondary.main, 0.9),
          alpha(theme.palette.primary.main, 0.9),
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'inherit'
          },
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} entries (${percentage}%)`;
          },
        },
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
    },
    cutout: '60%',
  };  return (    <Box 
      className={styles.statsContainer}
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 3,
        height: '100%',
        padding: 2,
        animation: 'fadeIn 0.8s ease-out',
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <StatCard
        value={totalEntries}
        label="Total Entries"
        color={theme.palette.primary.main}
      />

      <StatCard
        value={currentStreak}
        label="Current Streak (Days)"
        color={theme.palette.secondary.main}
      />

      <StatCard
        value={longestStreak}
        label="Longest Streak (Days)"
        color={theme.palette.success.main}
      />      {/* Beautiful Mood Chart */}
      {totalEntries > 0 && Object.keys(moodCounts).length > 0 && (
        <Paper
          elevation={4}
          sx={{
            gridColumn: '1 / -1',
            p: 4,
            borderRadius: 4,
            background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.04)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
            transition: 'all 0.5s ease',
            '&:hover': {
              boxShadow: `0 16px 50px ${alpha(theme.palette.primary.main, 0.25)}`,
              transform: 'translateY(-5px)',
            },
            animation: 'fadeInUp 0.8s ease-out',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(30px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              color: theme.palette.primary.main,
              fontWeight: 600,
              textAlign: 'center',
              mb: 3
            }}
          >
            📊 Mood Journey
          </Typography>
          
          <Box sx={{ 
            height: 300, 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <Doughnut data={chartData} options={chartOptions} />
            
            {/* Center content */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <Typography variant="h4" sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700 
              }}>
                {totalEntries}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 500 
              }}>
                Total Entries
              </Typography>
            </Box>
          </Box>
          
          {/* Mood summary */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2
          }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Most frequent mood:
            </Typography>
            <MoodDisplay mood={mostCommonMood} size="small" showLabel={true} />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default JournalStats;
