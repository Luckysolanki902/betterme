// pages/api/webhooks/clerk.js
import { Webhook } from 'svix';
import connectToMongo from '@/middleware/connectToMongo';
import Config from '@/models/Config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the headers and body
  const headers = req.headers;
  const payload = JSON.stringify(req.body);

  // Get the Svix headers for verification
  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occurred -- no svix headers' });
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

  let evt;

  // Attempt to verify the incoming webhook
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: 'Error occurred' });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    try {
      // Connect to MongoDB
      await connectToMongo();

      // Initialize user config with default categories
      const newConfig = new Config({
        userId: id,
        totalScore: 0,
        totalPossibleScore: 0,
        startDate: new Date(),
        categories: [
          "Mental & Emotional Wellbeing",
          "Morning Routine", 
          "Study & Learning",
          "Discipline & Habits",
          "Social & Communication Skills",
          "Work & Career",
          "Physical Health & Fitness", 
          "Recreation & Leisure",
          "Personal Development",
          "Self-Care & Hygiene",
          "Time Management"
        ],
        scoresByDay: new Map()
      });

      await newConfig.save();
      console.log(`Initialized config for new user: ${id}`);
    } catch (error) {
      console.error('Error initializing user config:', error);
      return res.status(500).json({ error: 'Failed to initialize user' });
    }
  }

  return res.status(200).json({ success: true });
}
