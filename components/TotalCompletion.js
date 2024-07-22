// components/TotalCompletion.js
import React from 'react';
import styles from './styles/TotalCompletion.module.css'; // Import the CSS Module

const TotalCompletion = ({ percentageProp, datestring }) => {
    const percentage = parseFloat(percentageProp) || 0;
    // Format the percentage to always have 5 digits with 2 decimal places
    let formattedPercentage
    // formattedPercentage = percentage.toFixed(2).padStart(6, '0');
    formattedPercentage = percentage.toFixed(2)
    if (percentage == 0 || percentage == 0.0) {
        formattedPercentage = '00.00';
    }



    return (
        <div className={styles.totalCompletionContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem' }}>
                {datestring &&
                    <div className={styles.totalCompletionNumber}>
                        {datestring}
                    </div>
                }
                <div className={styles.totalCompletionNumber}>
                    {formattedPercentage}
                </div>

            </div>
        </div>
    );
};

export default TotalCompletion;
