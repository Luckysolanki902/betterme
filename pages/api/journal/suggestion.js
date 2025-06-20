// pages/api/journal/suggestion.js
import { getUserId } from '@/middleware/clerkAuth';

// API to generate a single writing suggestion based on journal content
const handler = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure user is authenticated
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { content } = req.body;
    
    // Provide a default suggestion if no content is provided
    if (!content) {
      const defaultSuggestions = [
        "What made you smile today? Reflect on a moment that brought you joy.",
        "Describe a challenge you faced today. How did you overcome it?",
        "If you could change one thing about today, what would it be and why?",
        "What's something you're grateful for right now?",
        "What's one thing you learned today?"
      ];
      
      const randomIndex = Math.floor(Math.random() * defaultSuggestions.length);
      return res.status(200).json({
        suggestion: defaultSuggestions[randomIndex]
      });
    }

    // Here you could integrate with OpenAI for AI-generated suggestions
    // For now, we'll use some intelligent pre-written prompts based on time of day
    const hourOfDay = new Date().getHours();
    let suggestion;
    
    if (hourOfDay >= 5 && hourOfDay < 12) {
      // Morning prompts
      const morningPrompts = [
        "What are your intentions for today? How do you want to feel by the end of the day?",
        "Write about one thing you're looking forward to today.",
        "What's one habit you'd like to develop or improve?",
        "Describe your ideal morning routine. How close is it to your current one?",
        "What is your energy level this morning and how might it influence your day?"
      ];
      suggestion = morningPrompts[Math.floor(Math.random() * morningPrompts.length)];
    } else if (hourOfDay >= 12 && hourOfDay < 18) {
      // Afternoon prompts
      const afternoonPrompts = [
        "How has your day been going so far? Is there anything you want to adjust?",
        "What have you accomplished today that you're proud of?",
        "Are you taking care of your needs today? What else could you do for yourself?",
        "What challenges have you faced today and how did you respond?",
        "Write about something interesting you learned or observed today."
      ];
      suggestion = afternoonPrompts[Math.floor(Math.random() * afternoonPrompts.length)];
    } else {
      // Evening prompts
      const eveningPrompts = [
        "What are three things that went well today?",
        "What's something that happened today that you'd like to remember?",
        "How did you treat yourself and others today? Is there anything you'd change?",
        "What's something you're looking forward to tomorrow?",
        "What helped you feel calm or centered today?"
      ];
      suggestion = eveningPrompts[Math.floor(Math.random() * eveningPrompts.length)];
    }

    // Return the suggestion
    return res.status(200).json({ suggestion });
  } catch (error) {
    console.error('Error generating suggestion:', error);
    return res.status(500).json({ error: 'Failed to generate suggestion' });
  }
};

export default handler;
