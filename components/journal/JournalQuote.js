// components/journal/JournalQuote.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import styles from './JournalStyles.module.css';

// Collection of motivational quotes about journaling
const JOURNAL_QUOTES = [
  {
    quote: "Journal writing is a voyage to the interior.",
    author: "Christina Baldwin"
  },
  {
    quote: "What would you write if you weren't afraid?",
    author: "Mary Karr"
  },
  {
    quote: "Fill your paper with the breathings of your heart.",
    author: "William Wordsworth"
  },
  {
    quote: "Writing is an exploration. You start from nothing and learn as you go.",
    author: "E.L. Doctorow"
  },
  {
    quote: "Journal writing gives us insights into who we are, who we were, and who we can become.",
    author: "Sandra Marinella"
  },
  {
    quote: "Through journaling, you can track your progress, see how you've changed, and get better clarity about your life.",
    author: "Cameron Chapman"
  },
  {
    quote: "Documenting little details of your everyday life becomes a celebration of who you are.",
    author: "Carolyn V. Hamilton"
  },
  {
    quote: "Your journal is like your best friend, you don't have to pretend with it, you can be honest and write exactly how you feel.",
    author: "Bukola Ogunwale"
  },
  {
    quote: "Journal writing is a gift to yourself. By writing about your experiences, you learn more about yourself.",
    author: "Judy Harrison"
  },
  {
    quote: "In the journal I do not just express myself more openly than I could to any person; I create myself.",
    author: "Susan Sontag"
  },
  {
    quote: "People who keep journals have life twice.",
    author: "Jessamyn West"
  },
  {
    quote: "Writing in a journal reminds you of your goals and of your learning in life. It offers a place where you can hold a deliberate, thoughtful conversation with yourself.",
    author: "Robin S. Sharma"
  }
];

// Journal Quote component
const JournalQuote = () => {
  const theme = useTheme();
  const [quote, setQuote] = useState(JOURNAL_QUOTES[0]);
  
  // Select a random quote when component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * JOURNAL_QUOTES.length);
    setQuote(JOURNAL_QUOTES[randomIndex]);
  }, []);
  
  return (
    <Box 
 sx={{padding: '2rem 2rem'}}
    >
      <Box
        sx={{
          position: 'absolute',
          left: '20px',
          top: '10px',
          fontSize: '100px',
          lineHeight: 1,
          opacity: 0.08,
          color: theme.palette.primary.main,
          fontFamily: '"Georgia", serif',
        }}
      >
        "
      </Box>
      <Typography 
        variant="body1" 
        className={styles.quote}
        sx={{
          fontSize: '1.25rem',
          fontWeight: 400,
          fontStyle: 'italic',
          color: theme.palette.text.primary,
          letterSpacing: '0.01em',
          lineHeight: 1.6,
          position: 'relative',
          zIndex: 1
        }}
      >
        {quote.quote}
      </Typography>
      <Typography 
        variant="body2" 
        className={styles.quoteAuthor}
        sx={{
          fontWeight: 600,
          marginTop: '16px',
          textAlign: 'right',
          color: theme.palette.text.secondary,
          fontSize: '0.95rem'
        }}
      >
        — {quote.author}
      </Typography>
    </Box>
  );
};

export default JournalQuote;

