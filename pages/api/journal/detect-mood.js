// pages/api/journal/detect-mood.js
import connectToMongo from '@/middleware/connectToMongo';
const { getUserId } = require('@/middleware/journalEncryption');
import { MOOD_OPTIONS, DEFAULT_MOOD, getMoodByLabel } from '@/utils/moods'; // Import new mood definitions

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
        mood: DEFAULT_MOOD,
        isDefaultMood: true
      });
    }

    // Prepare the list of moods for the prompt
    const moodListForPrompt = MOOD_OPTIONS.map(m => `- ${m.label} (score: ${m.score})`).join('\n');

      // Prepare the prompt for OpenAI
    const prompt = `Analyze the following journal entry and determine the writer's overall mood. 
    
Journal entry: "${textToAnalyze.substring(0, 1500)}"
    
Based only on the text above, what is the primary emotional state of the writer? Analyze the text carefully, looking for emotional language, tone, and content. Then select the single most accurate mood label from this list:
${moodListForPrompt}
    
Return only a JSON object with the "label" property matching exactly one of the labels from the list provided. For example:
{ "label": "happy" }`;    // Call OpenAI API
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
            content: 'You are a mood analysis assistant that carefully analyzes journal entries to detect the primary emotional state. Return only a JSON object with "label" and optionally "confidence" fields. The label must exactly match one of the predefined mood options.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2, // Lower temperature for more deterministic output from the list
        max_tokens: 100, // Increased slightly to allow for confidence score
        response_format: { type: "json_object" } // Force JSON response format
      })
    });
    
    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI error:', error);
      // Fallback to default mood on OpenAI error
      return res.status(200).json({
        mood: DEFAULT_MOOD,
        isDefaultMood: true,
        error: 'OpenAI API request failed'
      });
    }
    
    const result = await openaiResponse.json();    const moodAnalysis = result.choices[0].message.content;
    
    // Parse the response to get the mood object
    let parsedMood;
    try {
      parsedMood = JSON.parse(moodAnalysis);
    } catch (e) {
      console.error('Failed to parse OpenAI response for mood detection (JSON.parse failed):', moodAnalysis, e);
      // Try to extract label with regex if JSON parsing fails
      const labelMatch = moodAnalysis.match(/"label":\s*"([a-zA-Z\s\-]+)"/i);      
      if (labelMatch && labelMatch[1]) {
        parsedMood = { label: labelMatch[1].trim() };
      } else {
        console.warn('Could not extract mood label with regex. OpenAI response:', moodAnalysis);
        return res.status(200).json({ mood: DEFAULT_MOOD, isDefaultMood: true, error: 'Failed to parse mood label from AI response' });
      }
    }

    if (!parsedMood || !parsedMood.label) {
      console.warn('OpenAI response did not contain a valid label. Response:', moodAnalysis);
      return res.status(200).json({ mood: DEFAULT_MOOD, isDefaultMood: true, error: 'AI response lacked a mood label' });
    }

    // Get the full mood object (including emoji and score) based on the detected label
    let detectedMoodObject = getMoodByLabel(parsedMood.label);
    
    // If we couldn't find a match by label but have a confidence score, try to find by score
    if (detectedMoodObject === DEFAULT_MOOD && parsedMood.label !== DEFAULT_MOOD.label && parsedMood.confidence) {
      // Map confidence (typically 0-1) to our score range (1-10)
      const mappedScore = Math.round(parsedMood.confidence * 9) + 1;
      const moodByScore = getMoodByScore(mappedScore);
      
      if (moodByScore !== DEFAULT_MOOD) {
        detectedMoodObject = moodByScore;
        console.log(`Found mood by score mapping. Original label: ${parsedMood.label}, mapped to: ${moodByScore.label}`);
      }
    }
    
    return res.status(200).json({
      mood: detectedMoodObject,
      isDefaultMood: false
    });
    
  } catch (error) {
    console.error('Error detecting mood:', error);
    return res.status(500).json({ mood: DEFAULT_MOOD, error: 'Internal server error during mood detection', isDefaultMood: true });
  }
};

export default connectToMongo(handler);
