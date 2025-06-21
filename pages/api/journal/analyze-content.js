// pages/api/journal/analyze-content.js
import connectToMongo from '@/middleware/connectToMongo';
const { getUserId } = require('@/middleware/journalEncryption');
import { MOOD_OPTIONS, DEFAULT_MOOD, getMoodByLabel } from '@/utils/moods';

// API handler for /api/journal/analyze-content
// Combined endpoint that returns both mood analysis and writing suggestions for journal entries
const handler = async (req, res) => {
  // Get the user ID for authentication
  const userId = getUserId(req);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the current journal content and parameters from the request body
    const { content = '', count = 5, analyzeMood = true } = req.body;
    
    // Validate content
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ 
        error: 'Valid journal content is required for analysis' 
      });
    }
    
    // Use the full journal content for mood analysis, but limit to 2000 chars for API efficiency
    const contentForMood = content.substring(0, 2000);
    
    // If there's not enough text, return default values
    if (content.trim().split(/\s+/).length < 10) {
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true,
        suggestions: [
          "Start by describing how you're feeling today",
          "What's one thing that went well today?",
          "What's something you're looking forward to?",
          "Describe a challenge you faced recently",
          "What are you grateful for today?"
        ],
        topSuggestion: "Start by describing how you're feeling today"
      });
    }

    // Prepare the prompt for OpenAI - combined mood detection and suggestions
    const prompt = `
    Please analyze this journal entry and provide two things:
    
    1. The writer's mood, using one of these labels and scoring it from 1-10:
    ${MOOD_OPTIONS.map(m => `"${m.label}" (score ${m.score})`).join(', ')}
    
    Where:
    - 1-3: Very negative feelings (sad, angry, upset, etc)
    - 4-6: Neutral feelings (okay, thoughtful, calm)
    - 7-10: Positive feelings (happy, excited, grateful)
    
    2. ${count} brief writing suggestions to continue the journal entry, each under 15 words.
    
    Journal entry: "${contentForMood}"
    
    Respond with ONLY a JSON object in this format:
    {
      "mood": {"label": "happy"},
      "suggestions": ["First suggestion", "Second suggestion", ...]
    }`;
    
    // Call OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured, returning default values');
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true,
        suggestions: [
          "Continue writing about how you feel",
          "Reflect on what went well today",
          "What could you have done differently?",
          "What are you looking forward to tomorrow?",
          "What are you grateful for right now?"
        ],
        topSuggestion: "Continue writing about how you feel"
      });
    }
    
    // Make the API call to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant that analyzes journal entries to determine the writer\'s mood and provide helpful writing suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      })
    });
    
    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true,
        suggestions: [
          "Continue writing about how you feel",
          "Reflect on what went well today",
          "What could you have done differently?",
          "What are you looking forward to tomorrow?",
          "What are you grateful for right now?"
        ],
        topSuggestion: "Continue writing about how you feel"
      });
    }
    
    const openaiData = await openaiResponse.json();
    const completionText = openaiData.choices[0]?.message?.content;
    
    if (!completionText) {
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true,
        suggestions: [],
        topSuggestion: ""
      });
    }
    
    try {
      // Parse the completion text as JSON
      const parsedData = JSON.parse(completionText.trim());
      
      // Extract and process mood
      let detectedMood = DEFAULT_MOOD;
      if (parsedData.mood && parsedData.mood.label) {
        detectedMood = getMoodByLabel(parsedData.mood.label);
      }
      
      // Extract suggestions
      let suggestions = [];
      if (Array.isArray(parsedData.suggestions)) {
        suggestions = parsedData.suggestions.slice(0, count);
      }
      
      // Get the top suggestion
      const topSuggestion = suggestions.length > 0 ? suggestions[0] : "";
      
      // Return both mood and suggestions
      return res.status(200).json({
        mood: detectedMood,
        suggestions,
        topSuggestion
      });
      
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError, completionText);
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true,
        suggestions: [],
        topSuggestion: ""
      });
    }
    
  } catch (error) {
    console.error('General error in analyze-content:', error);
    return res.status(500).json({
      error: 'Failed to analyze journal content',
      mood: DEFAULT_MOOD,
      isDefaultMood: true,
      suggestions: []
    });
  }
};

export default connectToMongo(handler);
