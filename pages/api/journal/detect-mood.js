// pages/api/journal/detect-mood.js
import connectToMongo from '@/middleware/connectToMongo';
const { getUserId } = require('@/middleware/journalEncryption');

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
    if (!content || !Array.isArray(content) || content.length === 0) {
      return res.status(400).json({ 
        error: 'Valid journal content is required for mood detection' 
      });
    }
    
    // Extract text content from journal blocks to analyze
    let textToAnalyze = '';
    content.forEach(block => {
      if (block.content) {
        textToAnalyze += block.content + ' ';
      }
      if (Array.isArray(block.listItems)) {
        block.listItems.forEach(item => {
          if (item.content) {
            textToAnalyze += item.content + ' ';
          }
        });
      }
    });
    
    // If there's not enough text, use a default mood
    if (textToAnalyze.trim().split(/\s+/).length < 10) {
      return res.status(200).json({
        mood: { label: 'neutral', score: 5 },
        isDefaultMood: true
      });
    }
      // Prepare the prompt for OpenAI
    const prompt = `Analyze the following journal entry and determine the writer's overall mood. 
    
Journal entry: "${textToAnalyze.substring(0, 1500)}"
    
Based only on the text above, what is the primary emotional state of the writer? Analyze the text carefully, looking for emotional language, tone, and content. Then select the single most accurate mood from this list:
- happy (score: 9) - Content, joyful, pleased, delighted
- calm (score: 8) - Peaceful, relaxed, serene, content
- excited (score: 10) - Enthusiastic, eager, energized, thrilled
- neutral (score: 5) - Balanced, neither positive nor negative, even-keeled
- sad (score: 3) - Unhappy, down, melancholy, disappointed
- angry (score: 2) - Annoyed, frustrated, upset, furious
- anxious (score: 4) - Worried, nervous, uneasy, concerned
- tired (score: 4) - Exhausted, drained, weary, fatigued

Return only a JSON object with "label" and "score" properties, like this:
{ "label": "neutral", "score": 5 }`;

    // Call OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured, returning default mood');
      return res.status(200).json({
        mood: { label: 'neutral', score: 5 },
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
          { role: 'system', content: 'You are a mood analysis assistant that analyzes journal entries and detects the primary emotional state.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 100
      })
    });
    
    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI error:', error);
      throw new Error('Failed to analyze mood with AI');
    }
    
    const result = await openaiResponse.json();
    const moodAnalysis = result.choices[0].message.content;
    
    // Parse the response to get the mood object
    let detectedMood;
    try {
      detectedMood = JSON.parse(moodAnalysis);
    } catch (e) {
      console.error('Failed to parse OpenAI response for mood detection:', e);
      // Extract using regex as fallback
      const labelMatch = moodAnalysis.match(/"label":\s*"([^"]+)"/);
      const scoreMatch = moodAnalysis.match(/"score":\s*(\d+)/);
      
      if (labelMatch && scoreMatch) {
        detectedMood = {
          label: labelMatch[1],
          score: parseInt(scoreMatch[1])
        };
      } else {
        // Use default if we can't parse it
        detectedMood = { label: 'neutral', score: 5 };
      }
    }
    
    return res.status(200).json({
      mood: detectedMood,
      isDefaultMood: false
    });
    
  } catch (error) {
    console.error('Error detecting mood:', error);
    return res.status(500).json({ error: 'Failed to detect mood' });
  }
};

export default connectToMongo(handler);
