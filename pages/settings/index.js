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
  Paper
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';

const Settings = () => {
  // States for reset dialogs
  const [openResetDate, setOpenResetDate] = useState(false);
  const [openResetProgress, setOpenResetProgress] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState('success');

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

  return (
    <Layout>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Divider sx={{ mb: 4 }} />

        {alertMessage && (
          <Alert 
            severity={alertSeverity} 
            sx={{ mb: 3 }}
            onClose={() => setAlertMessage(null)}
          >
            {alertMessage}
          </Alert>
        )}

        <Stack spacing={3}>
          <Paper elevation={1}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Reset Start Date
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This will reset the start date to today. All progress tracking will be calculated from today onwards.
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    color="warning" 
                    onClick={handleOpenResetDate}
                    startIcon={<DateRangeIcon />}
                  >
                    Reset Date
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Paper>

          <Paper elevation={1}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Reset Todo Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This will clear all completion records while keeping your todo items intact.
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    color="warning" 
                    onClick={handleOpenResetProgress}
                    startIcon={<CleaningServicesIcon />}
                  >
                    Reset Progress
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Paper>
        </Stack>
      </Box>

      {/* Reset Start Date Dialog */}
      <Dialog open={openResetDate} onClose={handleCloseResetDate}>
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
      <Dialog open={openResetProgress} onClose={handleCloseResetProgress}>
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
    </Layout>
  );
};

export default Settings;
