// pages/planner/index.js
import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  Container,
  InputAdornment,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import PlannerLayout from '@/components/planner/PlannerLayout';
import { useUser } from '@clerk/nextjs';

const PlannerIndex = () => {
  const [pages, setPages] = useState([]);
  const [filteredPages, setFilteredPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPage, setNewPage] = useState({ title: '' });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isLoaded } = useUser();

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/welcome');
    }
  }, [isLoaded, user, router]);
  useEffect(() => {
    if (isLoaded && user) {
      fetchPages();
    }
  }, [isLoaded, user]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/planner');
      
      if (!res.ok) {
        throw new Error('Failed to fetch pages');
      }
      
      const data = await res.json();
      setPages(data);
    } catch (error) {
      console.error('Error fetching planner pages:', error);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPage.title.trim()) return;
    
    try {
      setCreating(true);
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create page');
      }
      
      const createdPage = await res.json();
      setPages([...pages, createdPage]);
      setDialogOpen(false);
      setNewPage({ title: '', description: '' });
      
      // Navigate to the new page
      router.push(`/planner/${createdPage._id}`);
    } catch (error) {
      console.error('Error creating page:', error);
    } finally {
      setCreating(false);
    }
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewPage({ title: '' });
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPages(pages);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPages(pages.filter(page => 
        page.title.toLowerCase().includes(query) || 
        (page.description && page.description.toLowerCase().includes(query))
      ));
    }
  }, [searchQuery, pages]);

  const handleDeletePage = async (pageId) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/planner/${pageId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete page');
      }
      
      // Remove page from state
      setPages(pages.filter(page => page._id !== pageId));
    } catch (error) {
      console.error('Error deleting page:', error);
    } finally {
      setDeleting(false);
    }
  };
  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  // Only render if user is authenticated (redirect handled by useEffect)
  if (!user) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }
  return (
    <Layout>
      <Box 
        component={motion.div}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        sx={{ 
          mb: { xs: 2, sm: 3 },
          mx: { xs: 0.5, sm: 1, md: 2 },
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
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionOutlinedIcon sx={{ 
            fontSize: { xs: 22, sm: 28 }, 
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
            Planner
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '400px' }}>
          Create, organize, and track your plans and notes
        </Typography>
      </Box>
      
      <PlannerLayout>        {loading ? (
          <Box 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ p: 5 }}
          >
            <Paper
              elevation={0}
              sx={{ 
                p: 4, 
                borderRadius: 2,
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(8px)',
                textAlign: 'center',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <CircularProgress size={40} sx={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                
                <Typography variant="h6" color="primary">
                  Loading Your Planner Pages
                </Typography>
                
                <Typography variant="body1" color="textSecondary">
                  Preparing your workspace for productive planning
                </Typography>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 1,
                    justifyContent: 'center', 
                    width: '100%' 
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <Box 
                      key={i}
                      sx={{
                        height: 4,
                        width: '20%',
                        bgcolor: alpha(theme.palette.primary.main, 0.4 - (i * 0.1)),
                        borderRadius: 4,
                        animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        ) : error ? (
          <Box 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ p: 3, textAlign: 'center' }}
          >
            <Typography color="error" gutterBottom>{error}</Typography>
            <Button 
              variant="outlined" 
              onClick={fetchPages}
              sx={{ 
                mt: 2,
                borderRadius: '8px',
                textTransform: 'none',
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Your Pages
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  boxShadow: 'none',
                  fontWeight: 600,
                  background: 'linear-gradient(to right, #4263EB, #9370DB)',
                  '&:hover': {
                    background: 'linear-gradient(to right, #3b57d9, #8458d8)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(66, 99, 235, 0.2)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                New Page
              </Button>
            </Box>
            
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                placeholder="Search pages..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ 
                  flex: 1,
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  transition: 'border-color 0.3s ease',
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

            </Box>
            
            <Grid container spacing={3}>
              {filteredPages.map((page, index) => (
                <Grid 
                  item 
                  key={page._id} 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  component={motion.div}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Paper
                    elevation={0}
                    onClick={() => router.push(`/planner/${page._id}`)}
                    sx={{
                      p: 3,
                      height: '100%',
                      cursor: 'pointer',
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '5px',
                        height: '100%',
                        background: 'linear-gradient(to bottom, #4263EB, #9370DB)',
                        opacity: 0.8
                      }
                    }}
                  >                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pl: 1 }}>
                      <Box
                        sx={{
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 3px 5px rgba(66, 99, 235, 0.15)'
                        }}
                      >
                        <DescriptionOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                          }}
                        >
                          {page.title}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {page.isStatic && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.dark,
                            px: 1,
                            py: 0.5,
                            borderRadius: '4px',
                            fontWeight: 500
                          }}
                        >
                          Static
                        </Typography>
                      )}
                      
                      {page.childPages && page.childPages.length > 0 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.dark,
                            px: 1,
                            py: 0.5,
                            borderRadius: '4px',
                            fontWeight: 500
                          }}
                        >
                          {page.childPages.length} {page.childPages.length === 1 ? 'page' : 'pages'}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
              
              {filteredPages.length === 0 && (
                <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      textAlign: 'center', 
                      py: 5,
                      borderRadius: '12px',
                      border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02)
                    }}
                  >
                    <Typography color="text.secondary" gutterBottom>
                      No pages match your search. Try creating a new page.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setDialogOpen(true)}
                      sx={{ 
                        mt: 2,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(to right, #4263EB, #9370DB)',
                        boxShadow: '0 4px 10px rgba(66, 99, 235, 0.15)',
                      }}
                    >
                      Create Page
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </PlannerLayout>
      
      {/* Create page dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >        <DialogTitle sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(to right, #4263EB, #9370DB)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          pb: 1
        }}>
          Create New Page
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            placeholder="Enter page title"
            fullWidth
            required
            value={newPage.title}
            onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
            variant="outlined"
            InputProps={{
              sx: { 
                fontSize: '1.1rem',
                borderRadius: '10px',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPage.title.trim()) {
                e.preventDefault();
                handleCreatePage();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePage}
            disabled={!newPage.title.trim() || creating}
            startIcon={creating ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(to right, #4263EB, #9370DB)',
              px: 3,
              boxShadow: '0 4px 10px rgba(66, 99, 235, 0.15)',
            }}
          >
            {creating ? 'Creating...' : 'Create Page'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default PlannerIndex;
