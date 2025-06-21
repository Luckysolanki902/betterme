// pages/api/journal/detect-mood.js
import connectToMongo from '@/middleware/connectToMongo';
const { getUserId } = require('@/middleware/journalEncryption');
import { MOOD_OPTIONS, DEFAULT_MOOD, getMoodByLabel } from '@/utils/moods';

// API handler for /api/journal/detect-mood
// Uses OpenAI to analyze journal content and detect the mood
const handler = async (req, res) => {
  // Get the user ID for authentication
  const userId = getUserId(req);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the current journal content from the request body
    const { content } = req.body;
    
    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Valid journal content is required for mood detection' 
      });
    }
    
    // If there's not enough text, use a default mood
    if (content.trim().split(/\s+/).length < 10) {
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true
      });
    }

    // Prepare the prompt for OpenAI
    const prompt = `
    You are analyzing a journal entry to detect the writer's mood. 
    Based on the text, determine the appropriate mood label and score (1-10) where:
    - 1-3: Very negative feelings (sad, angry, upset, etc)
    - 4-6: Neutral feelings (okay, thoughtful, calm)
    - 7-10: Positive feelings (happy, excited, grateful)
    
    Here are the available mood labels:
    ${MOOD_OPTIONS.map(m => `"${m.label}" (score ${m.score})`).join(', ')}
    
    Journal entry: "${content.substring(0, 1000)}"
    
    Respond with ONLY a JSON object in this format:
    { "label": "happy" }`;
    
    // Call OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured, returning default mood');
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true
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
            content: 'You are a mood analysis assistant. You analyze text to determine the writer\'s mood.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });
    
    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true
      });
    }
    
    const openaiData = await openaiResponse.json();
    const completionText = openaiData.choices[0]?.message?.content;
    
    if (!completionText) {
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true
      });
    }
    
    // Extract the JSON response
    let detectedMood;
    try {
      // Find JSON objects in the text (in case there's other text)
      const jsonMatch = completionText.match(/\{[^{]*\}/);
      
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        const moodLabel = parsedResponse.label.toLowerCase();
        
        // Find the matching mood from our predefined options
        detectedMood = MOOD_OPTIONS.find(m => m.label === moodLabel);
        
        if (!detectedMood) {
          // If no exact match, find the closest one
          const closeMatch = MOOD_OPTIONS.find(m => 
            m.label.includes(moodLabel) || moodLabel.includes(m.label)
          );
          detectedMood = closeMatch || DEFAULT_MOOD;
        }
        
      } else {
        detectedMood = DEFAULT_MOOD;
      }
    } catch (error) {
      console.error('Error parsing mood from OpenAI response:', error);
      detectedMood = DEFAULT_MOOD;
    }
    
    // Add timestamp and AI detection flag
    const finalMood = {
      ...detectedMood,
      lastAnalyzed: new Date(),
      aiDetected: true
    };
    
    return res.status(200).json({
      mood: finalMood,
      isDefaultMood: false
    });
  } catch (error) {
    console.error('Error detecting mood:', error);
    return res.status(500).json({ error: 'Failed to detect mood' });
  }
};

export default connectToMongo(handler);
