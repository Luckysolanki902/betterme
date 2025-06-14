import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Container, 
  useTheme, 
  alpha,
  Skeleton
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
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const Progress = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

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
    }

    const periodText = currentPeriod === 'day' ? 'Today' : 
                      currentPeriod === 'week' ? 'This Week' : 'This Month';

    return (
      <Grid container spacing={3}>
        {/* Overall Completion Card */}
        <Grid item xs={12} md={6}>
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

        {/* Progress Insights */}
        <Grid item xs={12} md={6}>
          <ProgressInsight
            insights={progressData?.insights || {}}
            period={currentPeriod}
            animationDelay={0.2}
          />
        </Grid>

        {/* Categories Breakdown */}
        <Grid item xs={12} md={6}>
          <CategoriesChart 
            data={progressData?.categoryData || []} 
            animationDelay={0.3}
          />
        </Grid>

        {/* Progress Trend */}
        <Grid item xs={12} md={6}>
          <ProgressTrend 
            data={trendData} 
            period={currentPeriod} 
            animationDelay={0.4}
          />
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Layout>
      <Container maxWidth="lg">
        <Box 
          component={motion.div}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          sx={{ 
            mb: 4,
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 0 },
            position: 'relative',
            pb: 2,
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
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WhatshotIcon sx={{ 
              fontSize: 32, 
              mr: 1.5, 
              background: 'linear-gradient(to right, #4263EB, #9370DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }} />
            <Typography
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Your Progress Journey
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
        
        {/* Category selector */}
        <CategorySelector 
          categories={categories} 
          selectedCategory={selectedCategory}
          onChange={handleCategoryChange}
        />
        
        {/* Main content */}
        {renderProgressContent()}
      </Container>
    </Layout>
  );
};

export default Progress;
