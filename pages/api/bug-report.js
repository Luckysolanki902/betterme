import connectToMongo from '../../middleware/connectToMongo';
import BugReport from '../../models/BugReport';
import nodemailer from 'nodemailer';

// Email configuration
let transporter;
try {
  // Only create the transporter if environment variables are properly set
  if (process.env.NOTIFICATION_EMAIL_USER && process.env.NOTIFICATION_EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NOTIFICATION_EMAIL_USER,
        pass: process.env.NOTIFICATION_EMAIL_PASS,
      },
    });
  } else {
    console.log('Email notification disabled - credentials not configured');
  }
} catch (error) {
  console.error('Error configuring email transporter:', error);
}

async function sendNotificationEmail(bugReport) {
  // Skip sending email if credentials not configured
  if (!process.env.NOTIFICATION_EMAIL_USER || !process.env.NOTIFICATION_EMAIL_PASS) {
    console.log('Email notification skipped - email credentials not configured');
    return;
  }

  const emailSubject = `New ${bugReport.type === 'bug' ? 'Bug Report' : 'Suggestion'}`;
  
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #4263EB 0%, #9370DB 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Better Me - ${bugReport.type === 'bug' ? 'Bug Report' : 'Suggestion'}</h1>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; margin-bottom: 8px;">Report:</h3>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #4263EB;">
            ${bugReport.description.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            This ${bugReport.type === 'bug' ? 'bug report' : 'suggestion'} was submitted via the Better Me platform.
          </p>
          <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
            Report ID: ${bugReport._id}
          </p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.NOTIFICATION_EMAIL_USER,
    to: 'luckysolanki902@gmail.com',
    subject: emailSubject,
    html: emailBody,
  };  try {    // Only send email if transporter is properly configured
    if (transporter) {
      await transporter.sendMail(mailOptions);
      console.log('Notification email sent successfully');
    } else {
      console.log('Email notification skipped - transporter not initialized');
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't throw error - we still want to save the bug report even if email fails
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToMongo();

    const { type, description } = req.body;

    // Validation
    if (!type || !description) {
      return res.status(400).json({ 
        message: 'Missing required fields: type and description are required' 
      });
    }

    if (!['bug', 'feedback'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be "bug" or "feedback"' });
    }

    if (description.length > 5000) {
      return res.status(400).json({ message: 'Description must be 5000 characters or less' });
    }

    // Create new bug report
    const bugReport = new BugReport({
      type,
      description: description.trim(),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '',
    });

    const savedReport = await bugReport.save();

    // Send notification email
    await sendNotificationEmail(savedReport);

    res.status(201).json({
      message: 'Bug report submitted successfully',
      reportId: savedReport._id,
    });

  } catch (error) {
    console.error('Error submitting bug report:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }

    res.status(500).json({ 
      message: 'Internal server error. Please try again later.' 
    });
  }
}
