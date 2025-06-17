import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Container, 
  useTheme, 
  alpha,
  Skeleton,
  useMediaQuery
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import Layout from '@/components/Layout';
import EmptyState from '@/components/EmptyState';
import ProgressTabs from '@/components/ProgressTabs';
import CategorySelector from '@/components/CategorySelector';
import ProgressCard from '@/components/ProgressCard';
import ProgressInsight from '@/components/ProgressInsight';
import CategoriesChart from '@/components/CategoriesChart';
import ProgressTrend from '@/components/ProgressTrend';
import { useStreak } from '@/contexts/StreakContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const Progress = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(true);
  const [totalScore, setTotalScore] = useState({ improvement: 0, totalScore: 0, totalPossibleScore: 0 });
  const { currentStreak, longestStreak, dayCount } = useStreak();

  // Map tab value to period
  const tabToPeriod = ['day', 'week', 'month'];
  const currentPeriod = tabToPeriod[tabValue];
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/todos');
        const todos = await res.json();
        
        // Extract unique categories
        const uniqueCategories = [...new Set(todos.map(todo => todo.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch total score data
  useEffect(() => {
    const fetchTotalScore = async () => {
      try {
        const res = await fetch('/api/total-completion');
        const data = await res.json();
        setTotalScore(data);
      } catch (error) {
        console.error('Error fetching total score:', error);
      }
    };

    fetchTotalScore();
  }, []);

  // Fetch progress data when period or category changes
  useEffect(() => {
    const fetchProgressData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch main progress data
        const progressRes = await fetch(
          `/api/progress?period=${currentPeriod}&category=${selectedCategory}`
        );
        const progressData = await progressRes.json();
        setProgressData(progressData);
        setHasData(progressData.insights.completedTasks > 0);

        // Fetch trend data
        const trendRes = await fetch(
          `/api/progress/trend?period=${currentPeriod}&category=${selectedCategory}`
        );
        const trendData = await trendRes.json();
        setTrendData(trendData);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, [currentPeriod, selectedCategory]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const renderProgressContent = () => {
    if (isLoading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={6} key={item}>
              <Skeleton 
                variant="rounded" 
                width="100%" 
                height={300} 
                sx={{ borderRadius: 3 }} 
              />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (!hasData) {
      return (
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          sx={{ mt: 4 }}
        >
          <EmptyState 
            title="No progress data yet" 
            description="Complete some tasks to see your progress statistics"
            type="progress"
          />
        </Box>
      );
    }    const periodText = currentPeriod === 'day' ? 'Today' : 
                      currentPeriod === 'week' ? 'This Week' : 'This Month';

    return (
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Hero Section - % Better Version */}
        <Grid item xs={12}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 4,
              p: { xs: 3, sm: 4, md: 5 },
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              mb: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="20" cy="20" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.1,
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{ 
                color: 'white',
                fontWeight: 500,
                opacity: 0.9,
                mb: 1
              }}
            >
              You are
            </Typography>
            
            <Typography
              variant="h1"
              sx={{ 
                color: 'white',
                fontWeight: 800,
                fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                lineHeight: 0.9,
                mb: 1,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {parseFloat(totalScore.improvement || 0).toFixed(1)}%
            </Typography>
            
            <Typography
              variant="h4"
              sx={{ 
                color: 'white',
                fontWeight: 600,
                fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
                mb: 2,
                opacity: 0.95
              }}
            >
              Better Version of Yourself
            </Typography>
            
            <Typography
              variant="body1"
              sx={{ 
                color: 'white',
                opacity: 0.8,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                lineHeight: 1.6
              }}
            >
              Every task you complete is linear progress towards becoming your best self.
              <br />
            </Typography>
          </Box>
        </Grid>
        {/* Overall Completion Card */}
        <Grid item xs={12} sm={6} md={4}>
          <ProgressCard 
            title={`${periodText}'s Completion`}
            value={progressData?.insights?.completedTasks || 0}
            maxValue={progressData?.insights?.totalPossibleTasks || 1}
            icon={
              <DirectionsRunIcon sx={{ 
                color: theme.palette.primary.main 
              }} />
            }
            animationDelay={0.1}
          />
        </Grid>

        {/* Current Streak Card */}
        <Grid item xs={12} sm={6} md={4}>
          <ProgressCard 
            title="Current Streak"
            value={currentStreak}
            maxValue={longestStreak || currentStreak || 1}
            suffix="days"
            icon={
              <WhatshotIcon sx={{ 
                color: theme.palette.warning.main 
              }} />
            }
            animationDelay={0.2}
          />
        </Grid>



        {/* Progress Trend - Full Width on Mobile */}
        <Grid item xs={12}>
          <ProgressTrend 
            data={trendData} 
            period={currentPeriod} 
            animationDelay={0.6}
          />
        </Grid>
      </Grid>
    );
  };
    return (
    <Layout>
      <Container 
        maxWidth={false}
        sx={{ 
          px: { xs: 0.5, sm: 1, md: 2 },
          maxWidth: { xs: '100%', sm: '100%', md: '1200px' },
          mx: 'auto'
        }}
      >        <Box 
          component={motion.div}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          sx={{ 
            mb: { xs: 2, sm: 3 },
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1.5, sm: 0 },
            position: 'relative',
            pb: { xs: 1, sm: 2 },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100px',
              height: '3px',
              borderRadius: '4px',
              background: 'linear-gradient(to right, #4263EB, #9370DB)',
            }
          }}
        >          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WhatshotIcon sx={{ 
              fontSize: { xs: 24, sm: 32 }, 
              mr: { xs: 1, sm: 1.5 }, 
              background: 'linear-gradient(to right, #4263EB, #9370DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }} />
            <Typography
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: { xs: 1.2, sm: 1.3 },
              }}
            >
              Progress
            </Typography>
          </Box>
          <Box 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              px: 2, 
              py: 0.5, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.primary.main 
              }}
            >
              {format(new Date(), 'EEEE, MMMM d')}
            </Typography>
          </Box>
        </Box>
        
        {/* Time period tabs */}
        <ProgressTabs value={tabValue} onChange={handleTabChange} />
        

        
        {/* Main content */}
        {renderProgressContent()}
      </Container>
    </Layout>
  );
};

export default Progress;
