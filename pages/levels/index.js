import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Card
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { useSpring, useTrail, animated } from 'react-spring';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import Dashboard from '@/components/Dashboard';

const Levels = () => {
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [levelName, setLevelName] = useState('');
  const [noOfDays, setNoOfDays] = useState(30); // State for No of Days
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [improvedPercentage, setImprovedPercentage] = useState(0);
  const [totalImprovement, setTotalImprovement] = useState(0);
  const [totalDaysSinceStart, setTotalDaysSinceStart] = useState(0); // For overall days since the earliest level

  useEffect(() => {
    fetchLevels();
    fetchTotalCompletion();
  }, []);

  const fetchLevels = async () => {
    const res = await fetch('/api/levels');
    const data = await res.json();
    setLevels(data);
    setCurrentLevel(data.length - 1);
    calculateTotalDaysSinceStart(data);
  };

  // Function to calculate the total number of days since the start date of the earliest level
  const calculateTotalDaysSinceStart = (levelsData) => {
    if (levelsData.length > 0) {
      const earliestStartDate = new Date(levelsData[0].startDate); // Get the start date of the first level
      const currentDate = new Date();
      const diffInTime = currentDate - earliestStartDate;
      const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24)); // Convert the time difference to days
      setTotalDaysSinceStart(diffInDays + 1); // Add 1 to include today
    }
  };

  const createNextLevel = async () => {
    const newLevelData = {
      levelName,
      noOfDays,
    };

    await fetch('/api/levels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newLevelData),
    });

    fetchLevels();
    setDialogOpen(false);
    setLevelName('');
    setNoOfDays(30); // Resetting noOfDays after creation
  };

  const calculateImprovedPercentageForLevel = (levelIndex) => {
    if (levelIndex === 0) return levels[0]?.improvedPercentage;
    let total = totalImprovement.toFixed(2);
    for (let i = 0; i < levelIndex; i++) {
      total -= levels[i].improvedPercentage;
    }
    return total;
  };

  const handleEditToggle = (level) => {
    setEditMode(true);
    setLevelName(level.levelName);
    setNoOfDays(level.noOfDays); // Set the current noOfDays for editing
    setImprovedPercentage(level.improvedPercentage);
    setEditingLevelId(level._id);
    setDialogOpen(true);
  };

  const fetchTotalCompletion = async () => {
    const res = await fetch('/api/total-completion');
    const data = await res.json();
    setTotalImprovement(data.totalPercentage);
  };

  const handleSaveEdit = async () => {
    await fetch(`/api/levels/${editingLevelId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ levelName, improvedPercentage, noOfDays }), // Include noOfDays in the PUT request if needed
    });

    fetchLevels();
    setDialogOpen(false);
    setEditingLevelId(null);
    setLevelName('');
    setNoOfDays(30); // Resetting noOfDays after edit
  };

  const trail = useTrail(levels.length, {
    opacity: 1,
    transform: 'translateY(0px)',
    from: { opacity: 0, transform: 'translateY(20px)' },
    config: { tension: 220, friction: 20 },
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Box sx={{display:'flex', alignItems:'baseline', justifyContent:'center'}}>

          <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, color: '#3b5998' }}>
            My Journey
          </Typography>

          {/* Display total days since the earliest level */}
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 4, color: '#3b5998', marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
            {`${totalDaysSinceStart}`} <LocalFireDepartmentIcon sx={{ color: '#f57f17', fontSize: '2.5rem' }}/>
          </Typography>
        </Box>
        <Timeline sx={{ [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } }}>
          {trail.map((style, index) => {
            const level = levels[index];
            const isCurrentLevel = index === currentLevel;
            return (
              <TimelineItem key={level.level}>
                <TimelineSeparator>
                  <TimelineDot sx={{
                    borderRadius: '50%',
                    width: 40,  // Set a fixed width
                    height: 40, // Set a fixed height to ensure it's circular
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }} color={isCurrentLevel ? 'success' : 'primary'}>
                    <Typography variant="subtitle1" sx={{ color: '#fff' }}>{level.level}</Typography> {/* Show level number */}
                  </TimelineDot>
                  {index < levels.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <animated.div style={style}>
                    <Card sx={{ mb: 3, boxShadow: isCurrentLevel ? '0px 4px 12px rgba(0, 0, 0, 0.1)' : '0px 4px 12px rgba(0, 0, 0, 0.05)' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="h6" sx={{ color: isCurrentLevel ? 'green' : '#000' }}>
                            {level.levelName}
                          </Typography>
                        </Box>

                        {/* Number of Days Since Start */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            sx={{ color: '#555', mb: 0, fontSize: '1.2rem' }} // Set mb to 0 for better vertical alignment
                          >
                            {isCurrentLevel ? Math.floor((new Date() - new Date(level.startDate)) / (1000 * 60 * 60 * 24)) + 2 : level.noOfDays}
                          </Typography>
                          <LocalFireDepartmentIcon sx={{ marginLeft: '0.1rem', color: isCurrentLevel ? '#f57f17' : 'gray' }} />
                        </Box>
                        {/* Start Date */}
                        <Typography sx={{ color: '#555', mb: 1 }}>
                          {new Date(level.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: isCurrentLevel ? 'bold' : 'normal' }} color={isCurrentLevel ? 'success' : '#000'}>
                          {calculateImprovedPercentageForLevel(index)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </animated.div>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button variant="contained" sx={{ width: '200px' }} color="primary" onClick={() => setDialogOpen(true)}>
            Next Level
          </Button>
        </Box>

        {/* Dialog for Creating and Editing Levels */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{editMode ? 'Edit Level' : 'Create New Level'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Level Name"
              type="text"
              fullWidth
              variant="outlined"
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="No of Days"
              type="number"
              fullWidth
              variant="outlined"
              value={noOfDays}
              onChange={(e) => setNoOfDays(e.target.value)}
            />
            {editMode && (
              <TextField
                margin="dense"
                label="Improved Percentage"
                type="number"
                fullWidth
                variant="outlined"
                value={improvedPercentage}
                onChange={(e) => setImprovedPercentage(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={editMode ? handleSaveEdit : createNextLevel}>
              {editMode ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Dashboard currentPage={'levels'} />
    </Container>
  );
};

export default Levels;
