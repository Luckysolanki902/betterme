import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  TextField,
  Alert,
  Divider,
  Stack,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  useTheme,
  alpha,
  Grid
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BugReportIcon from '@mui/icons-material/BugReport';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SecurityIcon from '@mui/icons-material/Security';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const theme = useTheme();
  
  // State for tabs
  const [currentTab, setCurrentTab] = useState(0);
  
  // States for reset dialogs
  const [openResetDate, setOpenResetDate] = useState(false);
  const [openResetProgress, setOpenResetProgress] = useState(false);
  const [openResetTodos, setOpenResetTodos] = useState(false);
  const [openResetJournal, setOpenResetJournal] = useState(false);
  const [openResetPlanner, setOpenResetPlanner] = useState(false);
  const [openResetAll, setOpenResetAll] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  
  const [openBugReportDialog, setOpenBugReportDialog] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  
  const [confirmText, setConfirmText] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState('success');

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
      setAlertSeverity('error');
      setAlertMessage('Failed to logout. Please try again.');
    }
    setOpenLogoutDialog(false);
  };

  // Handle opening and closing dialogs
  const handleOpenResetDate = () => setOpenResetDate(true);
  const handleCloseResetDate = () => {
    setOpenResetDate(false);
    setConfirmText('');
  };

  const handleOpenResetProgress = () => setOpenResetProgress(true);
  const handleCloseResetProgress = () => {
    setOpenResetProgress(false);
    setConfirmText('');
  };
  
  const handleOpenResetTodos = () => setOpenResetTodos(true);
  const handleCloseResetTodos = () => {
    setOpenResetTodos(false);
    setConfirmText('');
  };
  
  const handleOpenResetJournal = () => setOpenResetJournal(true);
  const handleCloseResetJournal = () => {
    setOpenResetJournal(false);
    setConfirmText('');
  };
  
  const handleOpenResetPlanner = () => setOpenResetPlanner(true);
  const handleCloseResetPlanner = () => {
    setOpenResetPlanner(false);
    setConfirmText('');
  };
  
  const handleOpenResetAll = () => setOpenResetAll(true);
  const handleCloseResetAll = () => {
    setOpenResetAll(false);
    setConfirmText('');
  };
  
  const handleOpenBugReport = () => setOpenBugReportDialog(true);
  const handleCloseBugReport = () => {
    setOpenBugReportDialog(false);
    setBugDescription('');
  };

  // Reset start date
  const handleResetStartDate = async () => {
    if (confirmText !== 'reset date') return;

    try {
      const response = await fetch('/api/configs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate: new Date() }),
      });

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('Start date has been reset successfully');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to reset start date');
      }
    } catch (error) {
      setAlertSeverity('error');
      setAlertMessage('An error occurred while resetting the start date');
    }

    handleCloseResetDate();
  };

  // Reset todo progress (without deleting todos)
  const handleResetTodoProgress = async () => {
    if (confirmText !== 'reset progress') return;

    try {
      const response = await fetch('/api/completion/reset', {
        method: 'POST',
      });

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('Todo progress has been reset successfully');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to reset todo progress');
      }
    } catch (error) {
      setAlertSeverity('error');
      setAlertMessage('An error occurred while resetting todo progress');
    }

    handleCloseResetProgress();
  };
  
  // Reset todos completely
  const handleResetTodos = async () => {
    if (confirmText !== 'reset todos') return;

    try {
      const response = await fetch('/api/todos/reset', {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('All todos have been deleted successfully');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to delete todos');
      }
    } catch (error) {
      setAlertSeverity('error');
      setAlertMessage('An error occurred while deleting todos');
    }

    handleCloseResetTodos();
  };
  
  // Reset journal entries
  const handleResetJournal = async () => {
    if (confirmText !== 'reset journal') return;

    try {
      const response = await fetch('/api/journal/reset', {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('All journal entries have been deleted successfully');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to delete journal entries');
      }
    } catch (error) {
      setAlertSeverity('error');
      setAlertMessage('An error occurred while deleting journal entries');
    }

    handleCloseResetJournal();
  };
  
  // Reset planner pages
  const handleResetPlanner = async () => {
    if (confirmText !== 'reset planner') return;

    try {
      const response = await fetch('/api/planner/reset', {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('All planner pages have been deleted successfully');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to delete planner pages');
      }
    } catch (error) {
      setAlertSeverity('error');
      setAlertMessage('An error occurred while deleting planner pages');
    }

    handleCloseResetPlanner();
  };
  
  // Reset everything
  const handleResetAll = async () => {
    if (confirmText !== 'reset all data') return;

    try {
      const response = await fetch('/api/reset-all', {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('All your data has been reset successfully');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to reset all data');
      }
    } catch (error) {
      setAlertSeverity('error');
      setAlertMessage('An error occurred while resetting all data');
    }

    handleCloseResetAll();
  };
  
  // Submit bug report
  const handleSubmitBugReport = async () => {
    if (!bugDescription.trim()) return;
    
    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: bugDescription }),
      });

      if (response.ok) {
        setAlertSeverity('success');
        setAlertMessage('Bug report submitted successfully. Thank you!');
      } else {
        setAlertSeverity('error');
        setAlertMessage('Failed to submit bug report');
      }
    } catch (error) {
      setAlertSeverity('error');
      setAlertMessage('An error occurred while submitting the bug report');
    }

    handleCloseBugReport();
  };
  return (
    <Layout>
      <Box 
        sx={{ 
          my: { xs: 1, sm: 2 },
          px: { xs: 0.5, sm: 1, md: 2 },
          maxWidth: { xs: '100%', sm: '100%', md: '1000px' },
          mx: 'auto'
        }}
      >
        <Box 
          component={motion.div}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          sx={{ 
            mb: 3,
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
            <SecurityIcon sx={{ 
              fontSize: { xs: 28, sm: 36 }, 
              mr: { xs: 1, sm: 1.5 }, 
              color: theme.palette.primary.main 
            }} />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4263EB 0%, #9370DB 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Settings
            </Typography>
          </Box>
          
          {user && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                p: 1,
                pl: 2,
                pr: 2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }}
            >
              <Avatar
                src={user.imageUrl}
                alt={user.fullName || user.username}
                sx={{ 
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  mr: 1.5
                }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {user.fullName || user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.primaryEmailAddress?.emailAddress}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {alertMessage && (
          <Alert 
            severity={alertSeverity} 
            sx={{ mb: 3 }}
            onClose={() => setAlertMessage(null)}
          >
            {alertMessage}
          </Alert>
        )}

        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 3, 
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            mb: 4,
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 600,
              }
            }}
          >
            <Tab 
              label="Account" 
              icon={<AccountCircleIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Data Management" 
              icon={<DataUsageIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Bug Report" 
              icon={<BugReportIcon />} 
              iconPosition="start" 
            />
          </Tabs>
          
          {/* Account Tab */}
          {currentTab === 0 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                Account Settings
              </Typography>
              
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box 
                  display="flex" 
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between" 
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  gap={{ xs: 2, sm: 0 }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Sign Out
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign out of your account and return to the welcome page.
                    </Typography>
                  </Box>
                  <Button 
                    variant="contained" 
                    color="error" 
                    onClick={() => setOpenLogoutDialog(true)}
                    startIcon={<LogoutIcon />}
                    sx={{ 
                      flexShrink: 0,
                      minWidth: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Sign Out
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
          
          {/* Data Management Tab */}
          {currentTab === 1 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                Data Management
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.2)}`,
                        borderColor: theme.palette.primary.light
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DateRangeIcon sx={{ mr: 1.5, color: theme.palette.warning.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        Reset Start Date
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      This will reset the start date to today. All progress tracking will be calculated from today onwards.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="warning" 
                      onClick={handleOpenResetDate}
                      startIcon={<DateRangeIcon />}
                      fullWidth
                    >
                      Reset Date
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.2)}`,
                        borderColor: theme.palette.primary.light
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CleaningServicesIcon sx={{ mr: 1.5, color: theme.palette.warning.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        Reset Todo Progress
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      This will clear all completion records while keeping your todo items intact.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="warning" 
                      onClick={handleOpenResetProgress}
                      startIcon={<CleaningServicesIcon />}
                      fullWidth
                    >
                      Reset Progress
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.2)}`,
                        borderColor: theme.palette.primary.light
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DeleteForeverIcon sx={{ mr: 1.5, color: theme.palette.error.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        Reset All Todos
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      This will delete all your todo items permanently. This action cannot be undone.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleOpenResetTodos}
                      startIcon={<DeleteForeverIcon />}
                      fullWidth
                    >
                      Delete All Todos
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.2)}`,
                        borderColor: theme.palette.primary.light
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <NoteAltIcon sx={{ mr: 1.5, color: theme.palette.error.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        Reset Journal
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      This will delete all your journal entries permanently. This action cannot be undone.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleOpenResetJournal}
                      startIcon={<DeleteForeverIcon />}
                      fullWidth
                    >
                      Delete All Journal Entries
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      borderRadius: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 20px ${alpha(theme.palette.divider, 0.2)}`,
                        borderColor: theme.palette.primary.light
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AutorenewIcon sx={{ mr: 1.5, color: theme.palette.error.main }} />
                      <Typography variant="h6" fontWeight={600}>
                        Reset Planner
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      This will delete all your planner pages permanently. This action cannot be undone.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleOpenResetPlanner}
                      startIcon={<DeleteForeverIcon />}
                      fullWidth
                    >
                      Delete All Planner Pages
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                      background: alpha(theme.palette.error.main, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DeleteForeverIcon sx={{ mr: 1.5, color: theme.palette.error.main, fontSize: 32 }} />
                      <Typography variant="h6" fontWeight={700} color="error.main">
                        Reset Everything
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      This will delete all your data permanently including todos, journal entries, planner pages, and progress data. This action cannot be undone.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="error" 
                      onClick={handleOpenResetAll}
                      startIcon={<DeleteForeverIcon />}
                      sx={{ minWidth: { xs: '100%', sm: 200 } }}
                    >
                      Reset All Data
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Bug Report Tab */}
          {currentTab === 2 && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                Report a Bug
              </Typography>
              
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BugReportIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={600}>
                    Found a Bug?
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Help us improve the app by reporting any issues or bugs you encounter. Describe the problem in detail and we'll look into it.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleOpenBugReport}
                  startIcon={<BugReportIcon />}
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                >
                  Report a Bug
                </Button>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>      {/* Reset Start Date Dialog */}
      <Dialog open={openResetDate} onClose={handleCloseResetDate} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Start Date</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will set today as your new start date. All progress calculations will be made from today onwards.
            <br /><br />
            To confirm, type <strong>reset date</strong> below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'reset date' to confirm"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDate}>Cancel</Button>
          <Button 
            onClick={handleResetStartDate} 
            color="warning" 
            variant="contained"
            disabled={confirmText !== 'reset date'}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Todo Progress Dialog */}
      <Dialog open={openResetProgress} onClose={handleCloseResetProgress} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Todo Progress</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will clear all completion records while keeping your todo items intact. 
            Your progress tracking will be reset, but you'll keep all your todo items.
            <br /><br />
            To confirm, type <strong>reset progress</strong> below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'reset progress' to confirm"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetProgress}>Cancel</Button>
          <Button 
            onClick={handleResetTodoProgress} 
            color="warning" 
            variant="contained"
            disabled={confirmText !== 'reset progress'}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset All Todos Dialog */}
      <Dialog open={openResetTodos} onClose={handleCloseResetTodos} maxWidth="sm" fullWidth>
        <DialogTitle>Delete All Todos</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete all your todos. This cannot be undone.
            <br /><br />
            To confirm, type <strong>reset todos</strong> below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'reset todos' to confirm"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetTodos}>Cancel</Button>
          <Button 
            onClick={handleResetTodos} 
            color="error" 
            variant="contained"
            disabled={confirmText !== 'reset todos'}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Journal Dialog */}
      <Dialog open={openResetJournal} onClose={handleCloseResetJournal} maxWidth="sm" fullWidth>
        <DialogTitle>Delete All Journal Entries</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete all your journal entries. This cannot be undone.
            <br /><br />
            To confirm, type <strong>reset journal</strong> below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'reset journal' to confirm"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetJournal}>Cancel</Button>
          <Button 
            onClick={handleResetJournal} 
            color="error" 
            variant="contained"
            disabled={confirmText !== 'reset journal'}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Planner Dialog */}
      <Dialog open={openResetPlanner} onClose={handleCloseResetPlanner} maxWidth="sm" fullWidth>
        <DialogTitle>Delete All Planner Pages</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete all your planner pages. This cannot be undone.
            <br /><br />
            To confirm, type <strong>reset planner</strong> below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'reset planner' to confirm"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetPlanner}>Cancel</Button>
          <Button 
            onClick={handleResetPlanner} 
            color="error" 
            variant="contained"
            disabled={confirmText !== 'reset planner'}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset All Data Dialog */}
      <Dialog open={openResetAll} onClose={handleCloseResetAll} maxWidth="sm" fullWidth>
        <DialogTitle>Reset All Data</DialogTitle>
        <DialogContent>
          <DialogContentText>
            WARNING: This action will permanently delete ALL your data including todos, journal entries, planner pages, and progress data. This action cannot be undone!
            <br /><br />
            To confirm, type <strong>reset all data</strong> below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Type 'reset all data' to confirm"
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            error={confirmText.length > 0 && confirmText !== 'reset all data'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetAll}>Cancel</Button>
          <Button 
            onClick={handleResetAll} 
            color="error" 
            variant="contained"
            disabled={confirmText !== 'reset all data'}
          >
            Reset Everything
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bug Report Dialog */}
      <Dialog open={openBugReportDialog} onClose={handleCloseBugReport} maxWidth="md" fullWidth>
        <DialogTitle>Report a Bug</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please describe the issue you're experiencing in as much detail as possible. 
            Include what you were doing when the bug occurred, and any error messages you saw.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Bug Description"
            fullWidth
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
            multiline
            rows={6}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBugReport}>Cancel</Button>
          <Button 
            onClick={handleSubmitBugReport} 
            color="primary" 
            variant="contained"
            disabled={!bugDescription.trim()}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={openLogoutDialog} onClose={() => setOpenLogoutDialog(false)} maxWidth="sm">
        <DialogTitle>Sign Out</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out? You'll be redirected to the welcome page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoutDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleLogout} 
            color="error" 
            variant="contained"
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Settings;
