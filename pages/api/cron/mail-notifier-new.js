// pages/api/cron/mail-notifier.js
import nodemailer from 'nodemailer';
import connectToMongo from '@/middleware/connectToMongo';
import Todo from '@/models/Todo';
import { format } from 'date-fns';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.NOTIFICATION_EMAIL_USER,
      pass: process.env.NOTIFICATION_EMAIL_PASS,
    },
  });
};

// Beautiful and persuasive message templates
const getBeautifulTemplate = () => {
  const templates = [
    {
      title: "Your Future Self is Cheering You On! 🎯",
      message: "Every small step today creates the extraordinary you of tomorrow. Your consistency is building something beautiful.",
      emoji: "🌟",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      title: "Transform Begins with Today's Choice 💪",
      message: "The person you're becoming is shaped by what you do right now. Make today count!",
      emoji: "🚀",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      title: "Progress Over Perfection, Always ✨",
      message: "You don't need to be perfect, just consistent. Each completed task is a victory worth celebrating.",
      emoji: "🎭",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
      title: "Your Success Story is Writing Itself 📖",
      message: "Every habit you build, every goal you chase is a chapter in your amazing transformation story.",
      emoji: "✍️",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
    {
      title: "Momentum is Your Superpower 🔥",
      message: "The hardest part is starting. You've already begun - now let's keep that beautiful momentum going!",
      emoji: "⚡",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    },
    {
      title: "Small Wins Create Big Changes 🏆",
      message: "Today's tiny improvements compound into tomorrow's extraordinary results. You're closer than you think!",
      emoji: "🎯",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
    },
    {
      title: "Discipline is Your Freedom Fighter 🗽",
      message: "Every disciplined choice today creates more freedom tomorrow. You're investing in the life you want.",
      emoji: "💎",
      gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
    },
    {
      title: "Your Potential is Infinite ♾️",
      message: "There's no limit to what you can achieve when you show up consistently. Believe in your power!",
      emoji: "🌈",
      gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
    },
    {
      title: "Excellence is a Daily Practice 🎨",
      message: "Greatness isn't an accident - it's the result of daily choices. Today is your canvas to create something beautiful.",
      emoji: "🎪",
      gradient: "linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)"
    },
    {
      title: "Your Goals are Calling Your Name 📞",
      message: "They're waiting for you to answer with action. Every step forward is a step toward the life you deserve.",
      emoji: "📞",
      gradient: "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)"
    },
    {
      title: "Consistency Builds Legends 👑",
      message: "Legends aren't born overnight - they're built through daily dedication. You're writing your legend now.",
      emoji: "👑",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      title: "Today is Your Comeback Story 💫",
      message: "Every day is a new chance to get closer to your dreams. Your comeback starts with this moment.",
      emoji: "🌟",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      title: "Your Dreams Have an Expiration Date ⏰",
      message: "Not because they'll go bad, but because life is short and beautiful. Make every day count toward them!",
      emoji: "⏰",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
      title: "Progress is Your Love Language 💕",
      message: "Show yourself love by taking action on your goals. Every step forward is an act of self-care.",
      emoji: "💖",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
    {
      title: "Your Energy Creates Your Reality ⚡",
      message: "The energy you put into your goals today shapes the reality you'll live tomorrow. Make it powerful!",
      emoji: "⚡",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    },
    {
      title: "Success is Your Natural State 🌺",
      message: "You were born to succeed and thrive. Every action aligned with your goals proves this truth.",
      emoji: "🌸",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
    },
    {
      title: "Your Future Self Says Thank You 🙏",
      message: "Every good choice you make today is a gift to the person you're becoming. They're grateful for your effort!",
      emoji: "🙏",
      gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
    },
    {
      title: "Greatness Lives in the Details 🔍",
      message: "The small, consistent actions you take daily are the building blocks of extraordinary results.",
      emoji: "🔬",
      gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
    },
    {
      title: "Your Comfort Zone is Too Small 🦋",
      message: "You're meant for bigger things! Step outside what's comfortable and watch your world expand.",
      emoji: "🦋",
      gradient: "linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)"
    },
    {
      title: "Today's Effort = Tomorrow's Ease 🌅",
      message: "The work you put in now makes everything easier later. You're investing in a smoother, brighter future.",
      emoji: "🌅",
      gradient: "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)"
    },
    {
      title: "Your Story is Just Getting Started 📚",
      message: "This is not the end, it's not even the beginning of the end. This is the exciting beginning of your transformation!",
      emoji: "📖",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      title: "Every Pro was Once a Beginner 🌱",
      message: "The experts you admire all started exactly where you are now. Your journey to mastery begins today!",
      emoji: "🌳",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      title: "Your Potential is Your Responsibility 🔑",
      message: "You owe it to yourself and the world to unlock what you're capable of. Today is the perfect day to start!",
      emoji: "🗝️",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    {
      title: "Champions Train in Secret 🥷",
      message: "While others are sleeping, champions are building. Your consistent daily practice is your secret weapon.",
      emoji: "🏆",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
    {
      title: "Your Mind is Your Strongest Muscle 🧠",
      message: "Train it with positive actions and thoughts. Every goal you pursue makes your mind stronger and more resilient.",
      emoji: "💪",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    }
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
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

// Create beautiful email HTML content
const createEmailHTML = async (isMorning) => {
  try {
    await connectToMongo();
  } catch (error) {
    console.error('Database connection error:', error);
  }
  
  // Get incomplete todos
  let todos = [];
  try {
    todos = await Todo.find({}).sort({ priority: 1 });
  } catch (error) {
    console.error('Error fetching todos:', error);
  }
  
  const template = getBeautifulTemplate();
  const { quote, author } = getMotivationalQuote();
  const currentDate = format(new Date(), 'EEEE, MMMM do');
  const timeOfDay = isMorning ? 'Morning' : 'Evening';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Another Me - ${timeOfDay} Reminder</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: ${template.gradient};
          padding: 40px 30px;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          position: relative;
          z-index: 2;
        }
        
        .header .emoji {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
          position: relative;
          z-index: 2;
        }
        
        .header .date {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 500;
          position: relative;
          z-index: 2;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .greeting h2 {
          font-size: 24px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 16px;
          background: ${template.gradient};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .greeting p {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
          font-weight: 500;
        }
        
        .todos-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 40px;
          border: 1px solid #e2e8f0;
        }
        
        .todos-section h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .todo-item {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 12px;
          border-left: 4px solid #4facfe;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s ease;
        }
        
        .todo-item:hover {
          transform: translateX(4px);
        }
        
        .todo-item:last-child {
          margin-bottom: 0;
        }
        
        .todo-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }
        
        .todo-details {
          font-size: 14px;
          color: #666;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .todo-details span {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .quote {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 16px;
          margin-bottom: 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .quote::before {
          content: '"';
          font-size: 120px;
          position: absolute;
          top: -20px;
          left: 20px;
          opacity: 0.1;
          font-family: serif;
        }
        
        .quote-text {
          font-size: 18px;
          font-weight: 500;
          line-height: 1.6;
          margin-bottom: 16px;
          font-style: italic;
          position: relative;
          z-index: 2;
        }
        
        .quote-author {
          font-size: 14px;
          opacity: 0.8;
          font-weight: 600;
          position: relative;
          z-index: 2;
        }
        
        .cta-section {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          text-decoration: none;
          padding: 16px 40px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 10px 30px rgba(79, 172, 254, 0.3);
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(79, 172, 254, 0.4);
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-item {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        
        .stat-number {
          font-size: 28px;
          font-weight: 800;
          color: #4facfe;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        .footer {
          background: #f8fafc;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer-logo {
          font-weight: 800;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        
        @media (max-width: 600px) {
          body { padding: 10px; }
          .container { border-radius: 16px; }
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .header h1 { font-size: 24px; }
          .greeting h2 { font-size: 20px; }
          .todos-section { padding: 20px; }
          .quote { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="emoji">${template.emoji}</span>
          <h1>${template.title}</h1>
          <div class="date">${currentDate} • ${timeOfDay} Check-in</div>
        </div>
        
        <div class="content">
          <div class="greeting">
            <h2>Hey There, Champion! 👋</h2>
            <p>${template.message}</p>
          </div>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${todos.length}</div>
              <div class="stat-label">Active Tasks</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${new Date().getDate()}</div>
              <div class="stat-label">Days This Month</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">100%</div>
              <div class="stat-label">Belief in You</div>
            </div>
          </div>
          
          <div class="todos-section">
            <h3>🎯 Your Mission Today</h3>
            ${todos.length > 0
              ? todos.slice(0, 5).map(todo => `
                <div class="todo-item">
                  <div class="todo-title">${todo.title}</div>
                  <div class="todo-details">
                    <span>📂 ${todo.category}</span>
                    <span>⚡ ${todo.difficulty}</span>
                    <span>🏆 ${todo.score} pts</span>
                  </div>
                </div>
              `).join('')
              : `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                  <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                  <h4 style="margin-bottom: 8px; color: #4facfe;">Ready to Start Your Journey?</h4>
                  <p>Add your first task and begin building the life you deserve!</p>
                </div>
              `
            }
          </div>
          
          <div class="quote">
            <div class="quote-text">${quote}</div>
            <div class="quote-author">— ${author}</div>
          </div>
          
          <div class="cta-section">
            <a href="https://another-me.vercel.app" class="button">
              ${isMorning ? '🌅 Start Your Day Strong' : '🌙 Reflect & Plan Tomorrow'}
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-logo">Another Me</div>
          <div>&copy; ${new Date().getFullYear()} • Your Daily Growth Companion</div>
          <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
            Building better versions of ourselves, one day at a time ✨
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// API handler for email notifications
const handler = async (req, res) => {
  try {
    // Check if this is an authenticated request (from a cron job or Vercel cron)
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
    
    // Get beautiful template for subject line
    const template = getBeautifulTemplate();
    
    const info = await transporter.sendMail({
      from: `"Another Me 🌟" <${process.env.NOTIFICATION_EMAIL_USER}>`,
      to: "luckysolanki902@gmail.com",
      subject: isMorning ? 
        `🌅 ${template.title}` : 
        `🌙 Evening Reflection: ${template.title}`,
      html: htmlContent,
    });
    
    console.log('Beautiful notification email sent successfully:', info.messageId);
    
    return res.status(200).json({
      success: true,
      message: `Beautiful notification email sent successfully`,
      messageId: info.messageId,
      template: template.title
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
