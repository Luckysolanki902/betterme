// components/TotalCompletion.js
import React from 'react';
import styles from './styles/DailyCompletion.module.css';
import { Box, Typography, useTheme } from '@mui/material';

const DailyCompletion = ({ score = 0, totalPossibleScore = 0 }) => {
    const theme = useTheme();
    // Calculate the percentage based on score
    const percentage = totalPossibleScore > 0 ? ((score / totalPossibleScore) * 100).toFixed(1) : '0.0';
    
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
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500
                    }}
                >
                    Today's Score: {score}/{totalPossibleScore}
                </Typography>
            </Box>
        </div>
    );
};

export default DailyCompletion;
