// pages/api/journal/suggestions.js
import connectToMongo from '@/middleware/connectToMongo';
const { getUserId } = require('@/middleware/journalEncryption');

// API handler for /api/journal/suggestions
// Uses OpenAI to generate writing suggestions for journal entries
const handler = async (req, res) => {  // Get the user ID for authentication
  const userId = getUserId(req);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the current journal content from the request body
    const { prompt, currentContent = '', type = 'continue' } = req.body;
    
    // Validate required fields
    if (!currentContent && type === 'continue') {
      return res.status(400).json({ 
        error: 'Current content is required for continuing a journal entry' 
      });
    }
    
    // Define the prompt based on the suggestion type
    let fullPrompt = '';
    
    switch(type) {
      case 'start': 
        fullPrompt = `You are a helpful journaling assistant. Provide 3 thoughtful starting points for writing a journal entry.${
          prompt ? ` The user has indicated they want to write about: "${prompt}". ` : ' '
        }Each starting point should be 1-2 sentences that the user can expand upon. Format as three numbered bullet points.`;
        break;
      
      case 'continue':
        fullPrompt = `You are a helpful journaling assistant. Help the user continue their journal entry. Here's what they've written so far: 
        
"${currentContent}"

Based on this, suggest 3 thoughtful ways to continue their journal entry. Each suggestion should be 1-2 sentences that prompt deeper reflection or help them expand on their current thoughts. Format as three numbered bullet points.`;
        break;
        
      case 'question':
        fullPrompt = `You are a helpful journaling assistant. Based on the following journal entry, provide 3 thought-provoking questions that will help the user reflect more deeply.
        
"${currentContent}"

Make each question specific to what they've written, encouraging deeper introspection or new perspectives. Format as three numbered bullet points.`;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid suggestion type' });
    }
    
    // Call OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured', 
        suggestions: [
          "What emotions came up for me today and how did they affect my actions?",
          "What's one thing I'm grateful for today and why is it meaningful?",
          "What's a small victory I had today that I should celebrate?"
        ]
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using the mini model as requested
        messages: [
          {
            role: "system",
            content: "You are a helpful journaling assistant that provides thoughtful, concise suggestions."
          },
          {
            role: "user",
            content: fullPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Return fallback suggestions if API call fails
      return res.status(200).json({
        suggestions: [
          "Consider reflecting on the most meaningful interaction you had today.",
          "How might your future self feel about the decisions you're making now?",
          "What small change could make a big difference in your current situation?"
        ]
      });
    }
    
    const data = await response.json();
    const suggestionsText = data.choices[0].message.content;
    
    // Extract the numbered suggestions (1. 2. 3.)
    const suggestionRegex = /\d+\.\s+(.*?)(?=\d+\.|$)/gs;
    const matches = [...suggestionsText.matchAll(suggestionRegex)];
    
    const suggestions = matches.map(match => match[1].trim());
    
    // If we couldn't extract suggestions properly, return the full text
    if (suggestions.length === 0) {
      return res.status(200).json({
        suggestions: [suggestionsText]
      });
    }
    
    return res.status(200).json({ suggestions });
    
  } catch (error) {
    console.error('Error generating journal suggestions:', error);
    
    // Return fallback suggestions if there's an error
    return res.status(200).json({
      suggestions: [
        "What emotions were most present for you today?",
        "Describe a moment that challenged you and how you responded.",
        "What are you looking forward to tomorrow and why?"
      ]
    });
  }
};

export default connectToMongo(handler);
