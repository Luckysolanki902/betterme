// pages/index.js
import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  useTheme,
  alpha,
  Container,
  Button,
  Chip,
  Dialog,  DialogTitle,
  DialogContent,
  Fade,
  Slide,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Backdrop,
  useMediaQuery
} from '@mui/material';
import { differenceInDays, format } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import LockIcon from '@mui/icons-material/Lock';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CloseIcon from '@mui/icons-material/Close';
import Quote from '../components/Quote';
import Todos from '../components/Todos';
import TodosLoading from '../components/TodosLoading';
import Layout from '@/components/Layout';
import { useStartDate } from '@/contexts/StartDateContext';
import { useStreak } from '@/contexts/StreakContext';
import EmptyState from '@/components/EmptyState';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import ModifyTodosNew from '@/components/ModifyTodosNew';
import TypeAdminPassword from '@/components/TypeAdminPassword';
import { getAdjustedDateString } from '@/utils/streakUtils';

const quotes = [
  "Who I was yesterday is not who I am today, and who I am today will not be who I am tomorrow",
  "Progress is not achieved by luck or accident, but by working on yourself daily.",
  "Small daily improvements over time lead to stunning results.",
  "The only bad workout is the one that didn't happen.",
  "The journey of a thousand miles begins with one step.",
  "Don't count the days, make the days count."
];

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [scoreData, setScoreData] = useState({
    totalScore: 0,
    totalPossibleScore: 0,
    improvement: 0,
    todayScore: 0,
    todayPossibleScore: 0
  });  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [quote, setQuote] = useState('');
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const startDate = useStartDate();
  const { dayCount, updateStreak } = useStreak();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Combined loading state for UI
  const showTodosLoading = isLoadingTodos || isLoadingCompletions;
  
  // Check authentication status on load
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem('sessionId');
        
        if (!token) {
          setIsAuthenticated(false);
          setAuthChecking(false);
          return;
        }
        
        // Verify token with the server
        const res = await fetch('/api/security/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        const data = await res.json();
        setIsAuthenticated(data.success);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };
    
    checkAuthentication();
  }, []);

  // Only fetch data if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
      fetchTotalScore();
      setRandomQuote();
    }
  }, [isAuthenticated]);
  const fetchTodos = async () => {
    setIsLoadingTodos(true);
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
      fetchCompletions();
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setIsLoadingTodos(false);
    }
  };

  const fetchTotalScore = async () => {
    try {
      const res = await fetch('/api/total-completion');
      const data = await res.json();
      setScoreData(data);
    } catch (error) {
      console.error('Error fetching total score data:', error);
    }
  };  const fetchCompletions = async () => {
    setIsLoadingCompletions(true);
    try {
      const today = getAdjustedDateString();
      const res = await fetch(`/api/daily-completion?date=${today}`);
      const data = await res.json();
      setCompletedTodos(data.completedTodos.map(todo => todo._id));
      
      // Refresh todos list to get updated completion status
      const todosRes = await fetch('/api/todos');
      const todosData = await todosRes.json();
      setTodos(todosData);
    } catch (error) {
      console.error('Error fetching completions:', error);
    } finally {
      setIsLoadingCompletions(false);
    }
  };
  const handleTodoToggle = async (todoId) => {
    if (!todoId) {
      console.error('No todoId provided to toggle');
      return;
    }
    
    // Save original state before optimistic update
    const originalCompletedState = [...completedTodos];
    const isComplete = completedTodos.includes(todoId);
    
    try {
      // Optimistic update
      const updatedCompletedTodos = isComplete 
        ? completedTodos?.filter(id => id !== todoId)
        : [...completedTodos, todoId];
      
      setCompletedTodos(updatedCompletedTodos);
      
      const method = isComplete ? 'DELETE' : 'POST';
      const res = await fetch('/api/daily-completion', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todoId }),
      });

      if (!res.ok) {
        // If the request failed, revert to original state
        setCompletedTodos(originalCompletedState);
        throw new Error('Failed to update todo completion status');
      }
        const data = await res.json();      if (data.success) {
        fetchTotalScore();
        updateStreak(); // Update streak data
        // Refresh todos to get updated completion status
        const todosRes = await fetch('/api/todos');
        const todosData = await todosRes.json();
        setTodos(todosData);
      } else {
        // Revert optimistic update if request reports failure
        console.error('API returned success: false', data);
        setCompletedTodos(originalCompletedState);
      }
    } catch (error) {
      // Revert optimistic update on any error
      console.error('Error toggling todo completion:', error);
      setCompletedTodos(originalCompletedState);
      console.error('Error toggling todo:', error);
      // Revert optimistic update if request fails
      setCompletedTodos(originalCompletedState);
    }
  };

  const setRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  };

  // Calculate days streak

  const handleOpenModifyDialog = () => {
    setModifyDialogOpen(true);
  };

  const handleCloseModifyDialog = () => {
    setModifyDialogOpen(false);
    // Refresh todos after dialog closes
    fetchTodos();
    fetchTotalScore();
  };

  const calculateCompletionPercentage = () => {
    if (scoreData.todayPossibleScore === 0) return 0;
    return Math.round((scoreData.todayScore / scoreData.todayPossibleScore) * 100);
  };

  // Loading state
  if (authChecking) {
    return (
      <Layout>
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: theme => theme.zIndex.drawer + 1,
            background: 'linear-gradient(135deg, rgba(66, 99, 235, 0.97), rgba(147, 112, 219, 0.97))'
          }}
          open={true}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" size={60} thickness={4} />
            <Typography
              variant="h6"
              sx={{
                mt: 3,
                fontWeight: 600,
                color: 'white',
                letterSpacing: '0.5px'
              }}
            >
              Loading your journey...
            </Typography>
          </Box>
        </Backdrop>
      </Layout>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <Layout>
        <Container 
          maxWidth="md" 
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ py: 2, minHeight: '90vh', display: 'flex', alignItems: 'center' }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    fontWeight={800} 
                    gutterBottom
                    sx={{
                      background: 'linear-gradient(135deg, #4263EB 15%, #9370DB 85%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2,
                      lineHeight: 1.2
                    }}
                  >
                    Your Better Self Awaits
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '90%' }}>
                    Track your daily habits, build consistency, and unlock your full potential.
                  </Typography>
                </motion.div>                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                  {[
                    { icon: <AssignmentTurnedInIcon />, text: "Daily Tasks" },
                    { icon: <TrendingUpIcon />, text: "Progress Tracking" },
                    { icon: <EmojiEventsIcon />, text: "Achievement Systems" }
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + (i * 0.1) }}
                    >
                      <Chip
                        icon={feature.icon}
                        label={feature.text}
                        sx={{
                          px: 1,
                          py: 2.5,
                          borderRadius: 2,
                          "& .MuiChip-icon": {
                            color: theme.palette.primary.main
                          },
                          background: alpha(theme.palette.primary.main, 0.08),
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                          color: theme.palette.text.primary,
                          fontWeight: 500
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    background: alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <LockIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                    <Typography variant="h5" fontWeight={600}>
                      Secure Access
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 4, color: theme.palette.text.secondary }}>
                    Enter your password to access your personalized dashboard.
                  </Typography>
                  
                  <TypeAdminPassword onSuccess={() => setIsAuthenticated(true)} />
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Layout>
    );
  }
  return (
    <Layout>
      <Container 
        maxWidth={false}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        sx={{ 
          py: { xs: 0.5, sm: 1 },
          px: { xs: 0.5, sm: 1, md: 2 },
          maxWidth: { xs: '100%', sm: '100%', md: '900px' },
          mx: 'auto'
        }}
      >
        {/* Header with gradient accent and score */}        {/* Compact header with action buttons */}        <Box 
          component={motion.div}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          sx={{ 
            mb: { xs: 1.5, sm: 2.5 },
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 800, 
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: { xs: 1.2, sm: 1.3 },
              }}
            >
              Today's Tasks
            </Typography>
            
            <Chip 
              icon={<WhatshotIcon sx={{ fontSize: '0.85rem' }} />}
              label={`Day ${dayCount}`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ 
                fontWeight: 600, 
                borderRadius: 2,
                '& .MuiChip-icon': {
                  color: theme.palette.warning.main
                },
                borderColor: alpha(theme.palette.primary.main, 0.5),
              }}
            />
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1.5,
              mt: { xs: 0.5, sm: 0 }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                py: 0.5,
                px: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                background: alpha(theme.palette.primary.main, 0.07),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <EmojiEventsIcon 
                sx={{ 
                  color: theme.palette.warning.main,
                  fontSize: '1.2rem'
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700,
                  color: theme.palette.primary.main
                }}
              >
                {scoreData.todayScore}/{scoreData.todayPossibleScore}
              </Typography>
            </Paper>
            
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleOpenModifyDialog}
              sx={{
                background: 'linear-gradient(to right, #4263EB, #9370DB)',
                boxShadow: '0 4px 10px rgba(66, 99, 235, 0.2)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                py: 0.75,
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(66, 99, 235, 0.3)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isMobile ? 'Modify' : 'Modify Tasks'}
            </Button>
          </Box>
        </Box>

        {/* Todos Section - Placed first for focus */}
        <Box
          component={motion.div}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          sx={{
            mb: 4,
            borderRadius: '16px',
            overflow: 'visible',
          }}        >
          {showTodosLoading ? (
            <TodosLoading />
          ) : todos.length > 0 ? (
            <Todos 
              todos={todos} 
              completedTodos={completedTodos}
              onTodoToggle={handleTodoToggle}
            />
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: { xs: 6, sm: 8 },
                px: 4,
                background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              }}
            >
              <Box
                component={motion.div}
                animate={{ 
                  y: [-5, 5],
                  scale: [1, 1.05]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
                sx={{ mb: 3 }}
              >
                <Box
                  component="img"
                  src="https://cdn-icons-png.flaticon.com/512/6194/6194029.png"
                  alt="No tasks"
                  sx={{ 
                    width: 140,
                    height: 140,
                    opacity: 0.3
                  }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Ready to be productive?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                Add your first task to start building better habits and tracking your daily progress
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleOpenModifyDialog}
                sx={{
                  borderRadius: '12px',
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 8px 20px rgba(66, 99, 235, 0.3)',
                  background: 'linear-gradient(45deg, #4263EB 30%, #5C7CFA 90%)',
                }}
              >
                Create Your First Task
              </Button>
            </Box>
          )}
        </Box>

        {/* Stats cards - Moved below todos */}
        <Grid 
          container 
          spacing={2} 
          component={motion.div}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          sx={{ mb: 3 }}
        >
          {/* Completion Card */}
          <Grid item xs={12} sm={4}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 4,
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha('#9370DB', 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                overflow: 'visible',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '-15px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #4263EB, #9370DB)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(147, 112, 219, 0.3)'
                }}
              >
                <AssignmentTurnedInIcon sx={{ color: 'white' }} />
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Today's Completion
                </Typography>
                <Typography variant="h4" component="div" fontWeight="700" sx={{ mb: 1 }}>
                  {calculateCompletionPercentage()}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {console.log({todos})}
                  {todos?.filter(todo => todo?.completed).length} of {todos.length} tasks done
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Streak Card */}
          <Grid item xs={12} sm={4}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 4,
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
                overflow: 'visible',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '-15px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #ED6C02, #FF9800)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(237, 108, 2, 0.3)'
                }}
              >
                <WhatshotIcon sx={{ color: 'white' }} />
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Current Streak
                </Typography>
                <Typography variant="h4" component="div" fontWeight="700" sx={{ mb: 1 }}>
                  {dayCount} Days
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep the momentum going!
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Planner Card */}
          <Grid item xs={12} sm={4}>
            <Card 
              elevation={0}
              sx={{
                borderRadius: 4,
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.light, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                overflow: 'visible',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)'
                }
              }}
              onClick={() => router.push('/planner')}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '-15px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #2E7D32, #66BB6A)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                }}
              >
                <DescriptionIcon sx={{ color: 'white' }} />
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  My Planner
                </Typography>
                <Typography variant="h4" component="div" fontWeight="700" sx={{ mb: 1 }}>
                  Go to Planner
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View and manage your plans
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quote - Beautiful and minimal */}
        <Quote text={quote} />
        


 
  
        
        {/* Progress link */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 4,
            opacity: 0.8,
            '&:hover': {
              opacity: 1
            },
            transition: 'opacity 0.2s ease'
          }}
        >
          <Button 
            onClick={() => router.push('/progress')}
            endIcon={<ArrowForwardIcon />}
            variant="contained"
            sx={{
              background: 'linear-gradient(to right, #4263EB, #9370DB)',
              boxShadow: '0 4px 10px rgba(66, 99, 235, 0.2)',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '30px',
              px: 3,
              py: 1,
              '&:hover': {
                boxShadow: '0 6px 15px rgba(66, 99, 235, 0.3)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            View Your Progress Dashboard
          </Button>
        </Box>        {/* Modify dialog */}        <Dialog 
          open={modifyDialogOpen} 
          onClose={handleCloseModifyDialog}
          fullWidth
          maxWidth="md"
          TransitionComponent={Slide}
          TransitionProps={{ direction: "up", timeout: 500 }}
          PaperProps={{
            sx: {
              borderRadius: 6,
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.2)',
              background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)}, ${theme.palette.background.paper})`,
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              border: 'none',
            }
          }}
        >          <DialogTitle sx={{ 
            pb: 2,
            pt: 3,
            background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.07)} 0%, ${alpha(theme.palette.secondary.light, 0.07)} 100%)`,
            display: 'flex',
            borderBottom: 'none',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3
          }}>            <Box>
              <Box
                component={motion.div}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #4263EB 30%, #9370DB 90%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(66, 99, 235, 0.2)',
                  }}
                >
                  <EditIcon sx={{ color: 'white', fontSize: '1.4rem' }} />
                </Box>
                
                <Box>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    fontWeight={800}
                    sx={{ 
                      background: 'linear-gradient(45deg, #4263EB 30%, #9370DB 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.4rem', sm: '1.7rem' }
                    }}
                  >
                    Manage Your Tasks
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    component={motion.p}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    sx={{ fontWeight: 500, mt: 0.5 }}
                  >
                    Create and organize tasks to boost your productivity
                  </Typography>
                </Box>
              </Box>
            </Box><IconButton
              onClick={handleCloseModifyDialog}
              size="medium"
              edge="end"
              sx={{
                color: theme.palette.text.primary,
                width: 38,
                height: 38,
                background: alpha(theme.palette.divider, 0.08),
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.25s'
              }}
              component={motion.button}
              whileHover={{ rotate: 90, scale: 1.1 }}
              transition={{ duration: 0.25, type: "spring" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>          <DialogContent 
            sx={{ 
              px: { xs: 2, sm: 3 }, 
              pb: 4, 
              pt: 3, 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
                borderRadius: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: '8px',
              },
            }}
          >            <Box 
              sx={{ 
                height: '100%',
                position: 'relative'
              }}
            >
              <ModifyTodosNew open={true} onClose={handleCloseModifyDialog} />
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Home;
