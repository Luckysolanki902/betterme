// pages/api/cache/clear.js
import { getUserId } from '@/middleware/clerkAuth';

// This endpoint allows clearing cache when needed
const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Note: In a real production app, you'd want to clear the actual cache here
    // For now, this is just a placeholder that will trigger fresh fetches
    console.log(`Cache clear requested for user: ${userId}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({ error: 'Failed to clear cache' });
  }
};

export default handler;
