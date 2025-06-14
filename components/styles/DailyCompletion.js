// components/TotalCompletion.js
import React from 'react';
import styles from './styles/TotalCompletion.module.css'; // Import the CSS Module

const DailyCompletion = ({ percentageProp }) => {
    const percentage = parseFloat(percentageProp) || 0;
    // Format the percentage to always have 5 digits with 2 decimal places
    let formattedPercentage
    // formattedPercentage = percentage.toFixed(2).padStart(6, '0');
    formattedPercentage = percentage?.toFixed(2)
    if (percentage == 0 || percentage == 0.0) {
        formattedPercentage = '00.00';
    }

    return (
        <div className={styles.totalCompletionContainer} id={styles.totalCompletionContainer2}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', textAlign:'center', width:'100%', display:'flex', justifyContent:'center' }}>
                <div className={styles.totalCompletionNumber} id={styles.bigger}>
                    {formattedPercentage}
                </div>
            </div>
        </div>
    );
};

export default DailyCompletion;
