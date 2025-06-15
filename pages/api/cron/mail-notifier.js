// pages/api/cron/mail-notifier.js
import nodemailer from 'nodemailer';
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import { format } from 'date-fns';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Get motivational quotes
const getMotivationalQuote = () => {
  const quotes = [
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { quote: "If you can dream it, you can do it.", author: "Walt Disney" },
    { quote: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { quote: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
    { quote: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
    { quote: "The mind is everything. What you think you become.", author: "Buddha" },
    { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { quote: "Your life does not get better by chance, it gets better by change.", author: "Jim Rohn" },
    { quote: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { quote: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

// Create email HTML content
const createEmailHTML = async (isMorning) => {
  // Get incomplete todos
  const todos = await Todo.find({}).sort({ priority: 1 });
  
  const { quote, author } = getMotivationalQuote();
  const greeting = isMorning ? "Good Morning!" : "Good Evening!";
  const message = isMorning ? 
    "Here's what you need to focus on today. Start your day by completing these tasks!" :
    "Take a moment to review what you've accomplished today and what's left for tomorrow.";
  
  const date = new Date();
  const formattedDate = format(date, 'EEEE, MMMM do, yyyy');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">      <style>
        body {
          font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f7f7f7;
        }
        .container {
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 25px rgba(0,0,0,0.08);
        }
        .header {
          background-image: linear-gradient(135deg, #4263EB 0%, #9370DB 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          position: relative;
        }
        .header:after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background-image: linear-gradient(135deg, rgba(66, 99, 235, 0.2) 0%, rgba(147, 112, 219, 0.2) 100%);
          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
          transform: translateY(50%);
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          letter-spacing: 0.5px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .content {
          padding: 30px 25px;
          background-color: white;
        }
        .todo-list {
          margin-top: 25px;
        }
        .todo-item {
          padding: 12px 18px;
          margin-bottom: 10px;
          border-radius: 8px;
          background-color: #f8f9fa;
          border-left: 4px solid #4263EB;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }
        .todo-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.06);
        }
        .todo-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .todo-details {
          font-size: 13px;
          color: #666;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }        .quote {
          margin-top: 35px;
          padding: 25px;
          border-radius: 10px;
          background-color: #f8f9fa;
          font-style: italic;
          position: relative;
          box-shadow: 0 3px 10px rgba(0,0,0,0.04);
          background-image: linear-gradient(135deg, rgba(66, 99, 235, 0.03) 0%, rgba(147, 112, 219, 0.03) 100%);
        }
        .quote:before {
          content: """;
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 40px;
          color: rgba(147, 112, 219, 0.2);
          font-family: Georgia, serif;
        }
        .quote-author {
          text-align: right;
          margin-top: 12px;
          font-weight: 600;
          font-size: 14px;
          color: #555;
        }
        .footer {
          text-align: center;
          padding: 18px;
          font-size: 12px;
          color: #666;
          background-color: #f8f9fa;
          border-top: 1px solid #e0e0e0;
        }
        .button {
          display: inline-block;
          background-image: linear-gradient(135deg, #4263EB 0%, #9370DB 100%);
          color: white;
          padding: 12px 28px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 600;
          margin-top: 30px;
          text-align: center;
          box-shadow: 0 4px 10px rgba(66, 99, 235, 0.3);
          transition: all 0.3s ease;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(66, 99, 235, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Another Me</h1>
          <p>${formattedDate}</p>
        </div>
        <div class="content">
          <h2>${greeting}</h2>
          <p>${message}</p>
          
          <div class="todo-list">
            <h3>Your Tasks${isMorning ? " For Today" : ""}</h3>
            ${todos.length > 0 
              ? todos.map(todo => `
                <div class="todo-item">
                  <div class="todo-title">${todo.title}</div>
                  <div class="todo-details">
                    Category: ${todo.category} • Difficulty: ${todo.difficulty} • Score: ${todo.score}
                  </div>
                </div>
              `).join('')
              : '<p>No tasks yet. Add some tasks to start tracking your progress!</p>'
            }
          </div>
          
          <div class="quote">
            "${quote}"
            <div class="quote-author">— ${author}</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://another-me.vercel.app" class="button">Open Another Me</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Another Me • Daily Reminder • Stay focused and determined.
        </div>
      </div>
    </body>
    </html>
  `;
};

// API handler for email notifications
const handler = async (req, res) => {
  try {    // Check if this is an authenticated request (from a cron job or Vercel cron)
    // For Vercel cron jobs, we should check for their special header
    const isVercelCron = req.headers['x-vercel-cron'] === 'true';
    const apiKey = req.headers['x-api-key'];
    
    if (!isVercelCron && (!apiKey || apiKey !== process.env.CRON_API_KEY)) {
      console.warn('Unauthorized access attempt to mail-notifier');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current hour to determine if it's morning or evening notification
    const currentHour = new Date().getHours();
    const isMorning = currentHour >= 5 && currentHour < 12; // Considering 5AM-12PM as morning
    
    // Create email content
    const htmlContent = await createEmailHTML(isMorning);
    
    // Send email
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: `"Another Me" <${process.env.EMAIL_USER}>`,
      to: "luckysolanki902@gmail.com, luckysolanki9027@gmail.com",
      subject: isMorning ? 
        "🌞 Good Morning! Your Another Me Daily Tasks" : 
        "🌙 Evening Check-in | Another Me Tasks Review",
      html: htmlContent,
    });
    
    console.log('Email sent successfully:', info.messageId);
    
    return res.status(200).json({
      success: true,
      message: `Email sent successfully to recipients`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return res.status(500).json({ 
      error: 'Failed to send notification email',
      details: error.message 
    });
  }
};

export default connectToMongo(handler);
