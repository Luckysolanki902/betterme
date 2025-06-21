// components/DailyCompletion.js
import React from 'react';
import styles from './styles/DailyCompletion.module.css';
import { Box, Typography, useTheme, Tooltip, CircularProgress } from '@mui/material';

const DailyCompletion = ({ score = 0, totalPossibleScore = 0, completedTodos = [], todos = [], isLoading = false }) => {
    const theme = useTheme();
    
    // Calculate the percentage based on score
    const percentage = totalPossibleScore > 0 ? ((score / totalPossibleScore) * 100).toFixed(1) : '0.0';
    
    // Calculate completed task count from completedTodos length
    const completedTaskCount = completedTodos?.length || 0;
    const totalTaskCount = todos?.length || 0;
    
    if (isLoading) {
        return (
            <div className={styles.totalCompletionContainer} id={styles.totalCompletionContainer2}>
                <Box sx={{ 
                    width: '100%', 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2">Loading progress...</Typography>
                </Box>
            </div>
        );
    }
    
    return (
        <div className={styles.totalCompletionContainer} id={styles.totalCompletionContainer2}>
            <Box sx={{ 
                width: '100%', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
            }}>
                <div className={styles.totalCompletionNumber} id={styles.bigger}>
                    {percentage}%
                </div>
                
                <Tooltip title="Tasks completed today out of total tasks">
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            mt: 0.5
                        }}
                    >
                        {completedTaskCount} of {totalTaskCount} tasks completed
                    </Typography>
                </Tooltip>
                
                <Tooltip title="Points earned today out of total possible points">
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 500
                        }}
                    >
                        Score: {score}/{totalPossibleScore}
                    </Typography>
                </Tooltip>
            </Box>
        </div>
    );
};

export default DailyCompletion;
