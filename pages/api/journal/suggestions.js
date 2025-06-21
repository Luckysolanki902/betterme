// pages/api/journal/suggestions.js
import connectToMongo from '@/middleware/connectToMongo';
const { getUserId } = require('@/middleware/journalEncryption');

// API handler for /api/journal/suggestions
// Uses OpenAI to generate writing suggestions for journal entries
const handler = async (req, res) => {
  // Get the user ID for authentication
  const userId = getUserId(req);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the current journal content from the request body
    const { content = '', type = 'continue', count = 5 } = req.body;
    
    // Validate content
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ 
        error: 'Valid journal content is required for suggestions' 
      });
    }
    
    // Get the last few sentences to use as context (up to 1000 characters)
    const contentToAnalyze = content.trim().length > 1000 
      ? content.trim().substring(content.length - 1000) 
      : content.trim();
    
    // Skip if there's not enough context
    if (contentToAnalyze.length < 10) {
      return res.status(200).json({
        suggestions: [
          "Start by describing how you're feeling today",
          "What's one thing that went well today?",
          "What's something you're looking forward to?",
          "Describe a challenge you faced recently",
          "What are you grateful for today?"
        ]
      });
    }

    // Determine the suggestion type based on content or explicit request
    let suggestType = type;
    
    // If type is auto, try to detect what would be most helpful
    if (type === 'auto') {
      // Check for signs of being stuck
      const sentences = contentToAnalyze.split(/[.!?]+\s*/);
      const lastSentence = sentences[sentences.length - 1].trim();
      
      if (lastSentence.length < 5) {
        suggestType = 'continue'; // Just started a thought
      } else if (contentToAnalyze.endsWith('?') || contentToAnalyze.includes('wonder')) {
        suggestType = 'reflect'; // User asked a question
      } else if (contentToAnalyze.toLowerCase().includes('feel') || 
                contentToAnalyze.toLowerCase().includes('emotion')) {
        suggestType = 'emotional'; // User discussing feelings
      } else {
        suggestType = 'continue'; // Default
      }
    }
    
    // Build the prompt based on type
    let prompt = '';
    switch (suggestType) {
      case 'continue':
        prompt = `
        You are helping someone continue writing their journal entry.
        Based on the following journal text, provide ${count} brief suggestions for how they might continue.
        Each suggestion should be a natural continuation of their thought or a gentle prompt.
        Keep each suggestion under 12 words.
        
        Journal text: "${contentToAnalyze}"
        
        Provide ONLY a JSON array containing exactly ${count} string suggestions, like this:
        ["First suggestion", "Second suggestion", ...]
        `;
        break;
        
      case 'reflect':
        prompt = `
        You are helping someone reflect more deeply in their journal.
        Based on the following journal text, provide ${count} reflective questions they could answer.
        Questions should encourage deeper thinking about their experiences or feelings.
        Keep each question under 12 words and direct.
        
        Journal text: "${contentToAnalyze}"
        
        Provide ONLY a JSON array containing exactly ${count} string questions, like this:
        ["First question?", "Second question?", ...]
        `;
        break;
        
      case 'emotional':
        prompt = `
        You are helping someone explore their emotions in their journal.
        Based on the following journal text, provide ${count} prompts related to their feelings.
        Each prompt should help them identify or process emotions.
        Keep each prompt under 12 words.
        
        Journal text: "${contentToAnalyze}"
        
        Provide ONLY a JSON array containing exactly ${count} string prompts, like this:
        ["First prompt", "Second prompt", ...]
        `;
        break;
        
      default:
        prompt = `
        You are helping someone with their journal entry.
        Based on the following journal text, provide ${count} brief suggestions for what they might write next.
        Keep each suggestion under 12 words.
        
        Journal text: "${contentToAnalyze}"
        
        Provide ONLY a JSON array containing exactly ${count} string suggestions, like this:
        ["First suggestion", "Second suggestion", ...]
        `;
    }
    
    // Call OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured', 
        suggestions: [
          "Write about something that inspired you",
          "Reflect on a recent conversation",
          "Describe your current mood in detail",
          "What's one thing you learned today?",
          "Write about a small joy in your day"
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
            role: 'system',
            content: 'You are a helpful journaling assistant that provides short, helpful prompts and suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // Return generic suggestions on error
      return res.status(200).json({
        suggestions: [
          "Write about something that inspired you",
          "Reflect on a recent conversation",
          "Describe your current mood in detail",
          "What's one thing you learned today?",
          "Write about a small joy in your day"
        ]
      });
    }
    
    const data = await response.json();
    const suggestions = [];
    
    // Parse the response to extract suggestions
    try {
      const completionText = data.choices[0].message.content.trim();
      
      // Try to parse as JSON
      if (completionText.startsWith('[') && completionText.endsWith(']')) {
        const parsedSuggestions = JSON.parse(completionText);
        if (Array.isArray(parsedSuggestions)) {
          return res.status(200).json({
            suggestions: parsedSuggestions.slice(0, count)
          });
        }
      }
      
      // If not valid JSON, extract suggestions through regex
      const suggestionRegex = /"([^"]+)"/g;
      const matches = [...completionText.matchAll(suggestionRegex)];
      
      if (matches.length > 0) {
        const extractedSuggestions = matches.map(match => match[1]).slice(0, count);
        return res.status(200).json({
          suggestions: extractedSuggestions
        });
      }
      
      // Fallback: split by newlines and clean up
      const fallbackSuggestions = completionText
        .split(/\n+/)
        .map(line => line.replace(/^[0-9.-]*\s*["']?|["']?\s*$/g, '').trim())
        .filter(line => line.length > 0)
        .slice(0, count);
      
      return res.status(200).json({
        suggestions: fallbackSuggestions
      });
      
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      
      // Return generic suggestions on error
      return res.status(200).json({
        suggestions: [
          "Write about something that inspired you",
          "Reflect on a recent conversation",
          "Describe your current mood in detail",
          "What's one thing you learned today?",
          "Write about a small joy in your day"
        ]
      });
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

export default connectToMongo(handler);
