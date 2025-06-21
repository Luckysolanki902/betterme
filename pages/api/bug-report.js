import connectToMongo from '../../middleware/connectToMongo';
import BugReport from '../../models/BugReport';
import nodemailer from 'nodemailer';

// Email configuration (commented out until properly configured)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.NOTIFICATION_EMAIL_USER,
//     pass: process.env.NOTIFICATION_EMAIL_PASS,
//   },
// });

async function sendNotificationEmail(bugReport) {
  const emailSubject = `New ${bugReport.type === 'bug' ? 'Bug Report' : 'Feature Request'}: ${bugReport.title}`;
  
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #4263EB 0%, #9370DB 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Another Me - ${bugReport.type === 'bug' ? 'Bug Report' : 'Feature Request'}</h1>
      </div>
      
      <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">${bugReport.title}</h2>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #4263EB;">Type:</strong> 
          <span style="background: ${bugReport.type === 'bug' ? '#ffebee' : '#fff3e0'}; 
                       color: ${bugReport.type === 'bug' ? '#c62828' : '#ef6c00'}; 
                       padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${bugReport.type === 'bug' ? '🐛 BUG REPORT' : '💡 FEATURE REQUEST'}
          </span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #4263EB;">Severity:</strong> 
          <span style="background: ${getSeverityColor(bugReport.severity)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${bugReport.severity.toUpperCase()}
          </span>
          
          <strong style="color: #4263EB; margin-left: 20px;">Priority:</strong> 
          <span style="background: #9370DB; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${bugReport.priority.toUpperCase()}
          </span>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; margin-bottom: 8px;">Description:</h3>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #4263EB;">
            ${bugReport.description.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        ${bugReport.stepsToReproduce ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 8px;">Steps to Reproduce:</h3>
            <div style="background: #ffebee; padding: 15px; border-radius: 5px; border-left: 4px solid #f44336;">
              ${bugReport.stepsToReproduce.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}
        
        ${bugReport.expectedBehavior || bugReport.actualBehavior ? `
          <div style="display: flex; gap: 15px; margin-bottom: 20px;">
            ${bugReport.expectedBehavior ? `
              <div style="flex: 1;">
                <h4 style="color: #4caf50; margin-bottom: 8px;">Expected Behavior:</h4>
                <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; font-size: 14px;">
                  ${bugReport.expectedBehavior.replace(/\n/g, '<br>')}
                </div>
              </div>
            ` : ''}
            
            ${bugReport.actualBehavior ? `
              <div style="flex: 1;">
                <h4 style="color: #f44336; margin-bottom: 8px;">Actual Behavior:</h4>
                <div style="background: #ffebee; padding: 10px; border-radius: 5px; font-size: 14px;">
                  ${bugReport.actualBehavior.replace(/\n/g, '<br>')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div style="background: #f0f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Technical Information:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            ${bugReport.browser ? `<div><strong>Browser:</strong> ${bugReport.browser}</div>` : ''}
            ${bugReport.os ? `<div><strong>OS:</strong> ${bugReport.os}</div>` : ''}
            ${bugReport.email ? `<div><strong>Contact:</strong> ${bugReport.email}</div>` : ''}
            <div><strong>Submitted:</strong> ${new Date(bugReport.submittedAt).toLocaleString()}</div>
          </div>
        </div>
        
        ${bugReport.additionalInfo ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 8px;">Additional Information:</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${bugReport.additionalInfo.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            This ${bugReport.type === 'bug' ? 'bug report' : 'feature request'} was submitted via the Another Me platform.
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
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't throw error - we still want to save the bug report even if email fails
  }
}

function getSeverityColor(severity) {
  const colors = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
    critical: '#9C27B0'
  };
  return colors[severity] || '#4CAF50';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToMongo();

    const {
      type,
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      priority,
      browser,
      os,
      email,
      additionalInfo,
    } = req.body;

    // Validation
    if (!type || !title || !description) {
      return res.status(400).json({ 
        message: 'Missing required fields: type, title, and description are required' 
      });
    }

    if (!['bug', 'feature'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be "bug" or "feature"' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Title must be 200 characters or less' });
    }

    if (description.length > 2000) {
      return res.status(400).json({ message: 'Description must be 2000 characters or less' });
    }

    // Create new bug report
    const bugReport = new BugReport({
      type,
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: stepsToReproduce?.trim() || '',
      expectedBehavior: expectedBehavior?.trim() || '',
      actualBehavior: actualBehavior?.trim() || '',
      severity: severity || 'medium',
      priority: priority || 'medium',
      browser: browser?.trim() || '',
      os: os?.trim() || '',
      email: email?.trim() || '',
      additionalInfo: additionalInfo?.trim() || '',
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
