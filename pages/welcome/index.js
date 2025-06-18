import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  AutoAwesome,
  Psychology,
  Book,
  Star,
  AccountCircle,
  Login,
  PersonAdd,
  EmojiEvents,
  Lightbulb,
  TrackChanges,
  Analytics,
  NoEncryption,
  ArrowForward,
  PlayArrow,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useUser, SignInButton, SignUpButton, SignedOut, SignedIn } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

// Testimonials data
const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Designer",
    avatar: "SC",
    text: "Another Me transformed how I approach personal growth. The journaling feature alone is worth it!",
    rating: 5
  },
  {
    name: "Marcus Rodriguez", 
    role: "Software Engineer",
    avatar: "MR",
    text: "Finally, a productivity app that actually understands human psychology. My habits have never been stronger.",
    rating: 5
  },
  {
    name: "Emma Thompson",
    role: "Life Coach", 
    avatar: "ET",
    text: "I recommend Another Me to all my clients. It's like having a personal development coach in your pocket.",
    rating: 5
  }
];

// Stats data
const stats = [
  { number: "50K+", label: "Active Users", icon: <AccountCircle /> },
  { number: "1M+", label: "Journal Entries", icon: <Book /> },
  { number: "95%", label: "Goal Achievement", icon: <EmojiEvents /> },
  { number: "4.9★", label: "User Rating", icon: <Star /> }
];

// Feature highlights - comprehensive coverage
const features = [
  {
    icon: <TrackChanges sx={{ fontSize: 50 }} />,
    title: "Linear Progress Tracking: Real Growth, Real Numbers",
    description: "Forget the misleading '1% compound growth' myth that sets impossible expectations. Real personal growth is linear—you improve from your original baseline, not yesterday's version. Our intelligent scoring system reflects this reality: complete hard tasks (10 points), medium tasks (5 points), and easy ones (1 point) to see genuine, measurable growth. Do 20 hard workouts in a month? That's 200 points—a solid, honest 2% improvement from baseline you. No inflation, no false promises—just real progress you can trust.",
    color: "primary",
    detailed: true
  },
  {
    icon: <Lightbulb sx={{ fontSize: 50 }} />,
    title: "The Tarantino Method: One Night, Complete Transformation",
    description: "Inspired by how Quentin Tarantino writes entire screenplays in single intensive sessions, we believe one decisive evening can change everything. Dedicate a single night to honestly documenting what's wrong with your current life and what needs to change. By dawn, you'll have drafted actionable plans in our integrated Planner—workout schedules, business strategies, creative projects, or life overhauls. The next day isn't about planning anymore; it's about immediate, focused execution.",
    color: "secondary",
    detailed: true
  },
  {
    icon: <Psychology sx={{ fontSize: 50 }} />,
    title: "Smart Journaling: Break the Consistency Trap Forever", 
    description: "We all face emotional dips, motivation crashes, and the magnetic pull of old habits. The proven antidote? Writing. But staring at a blank page is paralyzing, so our AI-assisted Journal provides fresh, thought-provoking prompts every 30 seconds. The system automatically tags your mood patterns, correlates emotional states with productivity scores, and reveals exactly when and why you fall off track. Writing doesn't just vent emotions—it prevents the downward spiral before it begins, giving you unprecedented self-awareness.",
    color: "success",
    detailed: true
  },
  {
    icon: <Analytics sx={{ fontSize: 50 }} />,
    title: "Beautiful Progress Visualization: See Your Story Unfold",
    description: "Motivation thrives on visible progress, and our comprehensive dashboard transforms your daily efforts into striking visual narratives. Watch point totals steadily climb, habit streaks lengthen week by week, and mood patterns smooth out over time. Clean, intuitive graphs convert your raw effort into meaningful insights and actionable patterns. No more wondering if you're making progress—you'll see the proof in real-time, reinforcing your commitment and celebrating every milestone along your transformation journey.",
    color: "info",
    detailed: true
  }
];

// Detailed feature sections
const detailedFeatures = [
  {
    id: 'planner',
    icon: <Lightbulb sx={{ fontSize: 60 }} />,
    title: "Master Planner: Your Digital Command Center",
    subtitle: "Where Big Dreams Meet Actionable Plans",
    description: "Transform overwhelming goals into organized, achievable action plans with our sophisticated planner system.",
    benefits: [
      "Hierarchical page structure for complex projects",
      "Rich text editing with embedded content",
      "Task breakdown and milestone tracking", 
      "Cross-referencing between related plans",
      "Templates for common goal types"
    ],
    howToUse: [
      "Start with a brain dump—write everything you want to change",
      "Organize thoughts into themed pages (Fitness, Career, Relationships)",
      "Break down big goals into weekly and daily actions",
      "Use embedded pages to dive deep into specific strategies",
      "Review and adjust your plans as you evolve"
    ],
    color: "secondary"
  },
  {
    id: 'journal',
    icon: <Psychology sx={{ fontSize: 60 }} />,
    title: "Intelligent Journaling: Your Mental Clarity Engine", 
    subtitle: "Never Lose Momentum Again",
    description: "Combat inconsistency and emotional setbacks with AI-powered journaling that knows exactly what to ask when you're stuck.",
    benefits: [
      "AI prompts every 30 seconds when you're stuck",
      "Automatic mood tracking and pattern recognition",
      "Correlation analysis between emotions and productivity",
      "Weakness identification through writing patterns",
      "Consistency streak tracking and motivation"
    ],
    howToUse: [
      "Open the journal when you feel confused or unmotivated",
      "Start writing about anything—the AI will guide you",
      "Let prompts help you explore deeper thoughts and feelings",
      "Review mood trends to identify your vulnerable periods",
      "Use insights to proactively manage emotional dips"
    ],
    color: "success"
  },
  {
    id: 'progress',
    icon: <Analytics sx={{ fontSize: 60 }} />,
    title: "Progress Dashboard: Your Growth Observatory",
    subtitle: "End-to-End Encrypted, Beautifully Visualized",
    description: "See your entire transformation journey through stunning visualizations while knowing your data is completely private and secure.",
    benefits: [
      "Real-time progress tracking across all areas",
      "Beautiful charts showing mood, habits, and growth trends",
      "Streak tracking and milestone celebrations",
      "Comparative analysis between different life areas",
      "End-to-end encryption ensuring complete privacy"
    ],
    howToUse: [
      "Check your dashboard daily for motivation and insights",
      "Use trend analysis to optimize your approach",
      "Celebrate milestones and maintain momentum",
      "Identify patterns between different tracked metrics",
      "Export data for deeper personal analysis"
    ],
    color: "info"
  }
];

const WelcomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollToFeatures = () => {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthButtonClick = () => {
    if (isSignedIn) {
      router.push('/');
    }
  };

  // Don't redirect here - let the middleware handle it
  if (!isLoaded) {
    return null;
  }

  return (
    <Layout>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,      overflowX: 'hidden'
    }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  mb: 3,
                }}
              >
                What if you{' '}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  knew exactly
                </Box>{' '}
                how much better you've become?
              </Typography>
              
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.6
                }}
              >
                Not with vague feelings or wishful thinking, but with{' '}
                <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                  precise measurements
                </Box>
                ,{' '}
                <Box component="span" sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}>
                  real data
                </Box>
                , and{' '}
                <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  tangible proof
                </Box>{' '}
                of your growth journey.
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  mb: 5,
                  fontWeight: 500,
                  lineHeight: 1.7
                }}
              >
                <strong>Another Me</strong> redefines personal development with truth and precision. Unlike the misleading "compound growth" metaphor from <em>Atomic Habits</em>, we recognize that human improvement is <em>linear</em>—you become better compared to your original self, not yesterday's version. Every completed task earns points based on difficulty, creating a clear, honest measurement of how far you've truly come from where you started.
              </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                <SignedOut>
                  <SignUpButton mode="modal" forceRedirectUrl="/">
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      sx={{
                        borderRadius: 4,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        py: 2,
                        px: 4,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: `0 16px 50px ${alpha(theme.palette.primary.main, 0.4)}`,
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Start Your Transformation
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleAuthButtonClick}
                    sx={{
                      borderRadius: 4,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      py: 2,
                      px: 4,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: `0 16px 50px ${alpha(theme.palette.primary.main, 0.4)}`,
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </SignedIn>
                <Button
                  variant="text"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={scrollToFeatures}
                  sx={{
                    borderRadius: 4,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    py: 2,
                    px: 4,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  See How It Works
                </Button>
              </Stack>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Paper
                elevation={20}
                sx={{
                  p: 4,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.primary.main }}>
                  Your Progress Dashboard Preview
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                      Overall Progress
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={73} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                        }
                      }} 
                    />
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: theme.palette.primary.main }}>
                      73% Better
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {[
                      { label: 'Habits Completed', value: '127', color: 'primary' },
                      { label: 'Journal Entries', value: '45', color: 'secondary' },
                      { label: 'Goals Achieved', value: '8', color: 'success' },
                      { label: 'Streak Days', value: '23', color: 'info' }
                    ].map((stat, index) => (
                      <Grid item xs={6} key={index}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center', 
                            borderRadius: 3,
                            background: alpha(theme.palette[stat.color].main, 0.1),
                            border: `1px solid ${alpha(theme.palette[stat.color].main, 0.2)}`
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette[stat.color].main }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {stat.label}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 6,
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Trusted by Thousands of Growth-Minded Individuals
          </Typography>
          
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                      {stat.icon}
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        mb: 1,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}
                    >
                      {stat.label}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }} id="features-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontWeight: 900,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            The Complete Growth System
          </Typography>
          
          <Typography
            variant="h6"
            align="center"
            sx={{
              color: theme.palette.text.secondary,
              mb: 8,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Everything you need to track, analyze, and accelerate your personal development journey
          </Typography>
        </motion.div>

        <Grid container spacing={6}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card
                  elevation={12}
                  sx={{
                    height: '100%',
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${alpha(theme.palette[feature.color].main, 0.05)} 0%, ${alpha(theme.palette[feature.color].main, 0.02)} 100%)`,
                    border: `2px solid ${alpha(theme.palette[feature.color].main, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 60px ${alpha(theme.palette[feature.color].main, 0.2)}`,
                      border: `2px solid ${alpha(theme.palette[feature.color].main, 0.3)}`,
                    },
                    transition: 'all 0.4s ease',
                    cursor: 'pointer'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        color: theme.palette[feature.color].main,
                        mb: 3,
                        p: 2,
                        borderRadius: 3,
                        background: alpha(theme.palette[feature.color].main, 0.1),
                        display: 'inline-flex'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 3,
                        color: theme.palette[feature.color].main,
                        fontSize: { xs: '1.5rem', md: '1.8rem' }
                      }}
                    >
                      {feature.title}
                    </Typography>
                    
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        fontSize: '1.1rem'
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Philosophy Section - Linear vs Compound Growth */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, mt: 4 }} id="philosophy-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontWeight: 900,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
            }}
          >
            The Science Behind Our Approach
          </Typography>
          
          <Typography
            variant="h6"
            align="center"
            sx={{
              color: theme.palette.text.secondary,
              mb: 6,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Why we believe in linear growth for authentic personal development
          </Typography>
        </motion.div>

        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Paper
                elevation={16}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 800, color: theme.palette.warning.main }}>
                  The Compound Growth Myth
                </Typography>
                
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
                      37x
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.primary, fontWeight: 500 }}>
                      "Improve by 1% daily and you'll be 37 times better in a year."
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      — <em>Popular interpretation of Atomic Habits</em>
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                  The famous compound growth formula from <em>Atomic Habits</em> promises exponential results: 
                  1.01<sup>365</sup> = 37.8. But this mathematical model implies each day's improvement builds on 
                  yesterday's improved self—a misleading premise for human development.
                </Typography>
                
                <Box sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}` }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>
                    "If I could run 1 mile yesterday and improve by 1% today, I'd run 1.01 miles. 
                    After a year of this compound growth, I'd supposedly run 37.8 miles at once—physically 
                    impossible for most humans. This mathematical fallacy doesn't reflect real human capability."
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Paper
                elevation={16}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 800, color: theme.palette.success.main }}>
                  The Linear Growth Reality
                </Typography>
                
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                      100%
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.primary, fontWeight: 500 }}>
                      "Each achievement improves the baseline you by a specific percentage."
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      — <em>Another Me Growth Model</em>
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                  Real personal growth is about improving from your original baseline—not the improved version of yourself from yesterday. 
                  Each task completed, each habit formed represents a percentage improvement of <em>the original you</em>. 
                  This is authentic, measurable growth.
                </Typography>
                
                <Box sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px dashed ${alpha(theme.palette.success.main, 0.3)}` }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: theme.palette.success.main }}>Our Formula:</Typography>
                  <Typography variant="body2">
                    • Hard task = 10 points (e.g., exercise, deep work)<br />
                    • Medium task = 5 points (e.g., reading, meditation)<br />
                    • Easy task = 1 point (e.g., quick habits)<br /><br />
                    <strong>200 points = 2% improvement</strong> of your baseline self (100%)
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* Visualization of the difference */}
        <Box sx={{ mt: 6, mb: 4, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 700 }}>
              Visualizing Our Approach: The Tarantino Method
            </Typography>
            
            <Paper 
              elevation={8} 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                maxWidth: '900px', 
                mx: 'auto',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 2, fontWeight: 600 }}>
                      The One-Night Transformation Plan
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.8 }}>
                      Named after filmmaker Quentin Tarantino's decisive approach, this method encourages you 
                      to dedicate a single evening to intense reflection and planning. Write down everything 
                      that needs to change, create actionable systems, and begin execution immediately—no 
                      gradual ramp-up, just immediate implementation.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box 
                    component={Paper} 
                    elevation={4} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: theme.palette.background.paper
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                      The Tarantino Timeline:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.primary.main, 
                        color: '#fff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 1.5,
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        1
                      </Box>
                      <Typography variant="body2">
                        <strong>Evening 1:</strong> Brain dump everything that needs fixing
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.secondary.main, 
                        color: '#fff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 1.5,
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        2
                      </Box>
                      <Typography variant="body2">
                        <strong>Same Night:</strong> Create detailed action plans in Planner
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.success.main, 
                        color: '#fff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 1.5,
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        3
                      </Box>
                      <Typography variant="body2">
                        <strong>Next Morning:</strong> Begin immediate execution, no delays
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Box>      </Container>

      {/* Detailed Feature Sections */}
      {detailedFeatures.map((feature, index) => (
        <Container key={feature.id} maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Paper
              elevation={16}
              sx={{
                p: { xs: 4, md: 8 },
                borderRadius: 6,
                background: `linear-gradient(135deg, ${alpha(theme.palette[feature.color].main, 0.05)} 0%, ${alpha(theme.palette[feature.color].main, 0.02)} 100%)`,
                border: `2px solid ${alpha(theme.palette[feature.color].main, 0.1)}`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background decoration */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: alpha(theme.palette[feature.color].main, 0.03),
                }}
              />
              
              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 4 }}>
                    <Box
                      sx={{
                        color: theme.palette[feature.color].main,
                        mb: 3,
                        p: 2,
                        borderRadius: 3,
                        background: alpha(theme.palette[feature.color].main, 0.1),
                        display: 'inline-flex'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 900,
                        mb: 2,
                        color: theme.palette[feature.color].main,
                        fontSize: { xs: '2rem', md: '2.5rem' }
                      }}
                    >
                      {feature.title}
                    </Typography>
                    
                    <Typography
                      variant="h5"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 3,
                        fontWeight: 600,
                        fontStyle: 'italic'
                      }}
                    >
                      {feature.subtitle}
                    </Typography>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        lineHeight: 1.7,
                        fontSize: '1.2rem',
                        mb: 4
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 3,
                        color: theme.palette[feature.color].main
                      }}
                    >
                      Why It Works
                    </Typography>
                    
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <Box key={benefitIndex} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: theme.palette[feature.color].main,
                            mt: 1,
                            mr: 2,
                            flexShrink: 0
                          }}
                        />
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.palette.text.primary,
                            lineHeight: 1.6,
                            fontSize: '1.1rem'
                          }}
                        >
                          {benefit}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 3,
                        color: theme.palette[feature.color].main
                      }}
                    >
                      How to Use It
                    </Typography>
                    
                    {feature.howToUse.map((step, stepIndex) => (
                      <Box key={stepIndex} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Box
                          sx={{
                            minWidth: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: theme.palette[feature.color].main,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          {stepIndex + 1}
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.palette.text.primary,
                            lineHeight: 1.6,
                            fontSize: '1.1rem'
                          }}
                        >
                          {step}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
              
              {/* Security callout for progress section */}
              {feature.id === 'progress' && (
                <Box
                  sx={{
                    mt: 6,
                    p: 4,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    color: 'white',
                    textAlign: 'center'
                  }}
                >
                  <NoEncryption sx={{ fontSize: 50, mb: 2 }} />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      mb: 2
                    }}
                  >
                    🔒 End-to-End Encrypted
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      opacity: 0.9,
                      maxWidth: '600px',
                      mx: 'auto',
                      lineHeight: 1.6
                    }}
                  >
                    Every single data point—your goals, your progress, your thoughts—is encrypted with military-grade security before it ever leaves your device. Not even we can access your personal information. Your growth journey is yours alone.
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Container>
      ))}

      {/* Focus Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Paper
            elevation={16}
            sx={{
              p: { xs: 4, md: 8 },
              borderRadius: 8,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: alpha('#fff', 0.1),
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: alpha('#fff', 0.05),
              }}
            />
            
            <NoEncryption sx={{ fontSize: 80, mb: 3, opacity: 0.9 }} />
            
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 3,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              100% Focus, 0% Distractions
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                opacity: 0.9,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              No paywalls, no ads, no hidden upgrades. <strong>Another Me</strong> exists for one purpose: to help you shape the life you want, faster and with crystal-clear feedback on your journey.
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                opacity: 0.8,
                fontStyle: 'italic',
                fontWeight: 500
              }}
            >
              Your commitment is the only currency that counts.
            </Typography>
          </Paper>
        </motion.div>
      </Container>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 8,
              background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            What Our Users Say
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card
                  elevation={8}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    background: currentTestimonial === index 
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                      : 'background.paper',
                    border: currentTestimonial === index 
                      ? `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
                      : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transform: currentTestimonial === index ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} sx={{ color: '#FFD700', fontSize: 20 }} />
                      ))}
                    </Stack>
                    
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        mb: 3,
                        fontStyle: 'italic',
                        fontSize: '1.1rem'
                      }}
                    >
                      "{testimonial.text}"
                    </Typography>
                    
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          fontWeight: 700
                        }}
                      >
                        {testimonial.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Final CTA Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Paper
            elevation={20}
            sx={{
              p: { xs: 6, md: 10 },
              borderRadius: 8,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 4,
                fontSize: { xs: '2rem', md: '3rem' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Ready to see measurable proof that you're better today than yesterday?
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.text.secondary,
                mb: 6,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              Open <strong>Another Me</strong>, set your first tasks, and start scoring your transformation — one honest percentage point at a time.
            </Typography>
              <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AutoAwesome />}
                  sx={{
                    borderRadius: 4,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    py: 3,
                    px: 6,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 16px 50px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Start Your Journey Today
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button
                variant="contained"
                size="large"
                startIcon={<AutoAwesome />}
                onClick={handleAuthButtonClick}
                sx={{
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  py: 3,
                  px: 6,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 16px 50px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Go to Dashboard
              </Button>
            </SignedIn>
          </Paper>
        </motion.div>
      </Container>
    </Box>
    </Layout>
  );
}

export default WelcomePage;
