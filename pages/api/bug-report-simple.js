import connectToMongo from '@/middleware/connectToMongo';
import BugReport from '@/models/BugReport';

/**
 * Simplified API endpoint for submitting bug reports and feedback
 * No user authentication required - completely anonymous reporting
 */
const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // Extract only the necessary fields from the request body
      const { title, description, type = 'bug', email } = req.body;
      
      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({ 
          success: false, 
          error: 'Title and description are required' 
        });
      }
      
      // Create new bug report with minimal fields
      const bugReport = new BugReport({
        title,
        description,
        type: type === 'feature' ? 'feedback' : 'bug', // Normalize type to either 'bug' or 'feedback'
        email: email || undefined, // Make email optional
        submittedAt: new Date()
      });
      
      // Save the report
      await bugReport.save();
      
      // Send successful response
      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        id: bugReport._id
      });
    } catch (error) {
      console.error('Error submitting bug report:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to submit report' 
      });
    }
  } else {
    // Only allow POST requests
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }
};

export default connectToMongo(handler);
