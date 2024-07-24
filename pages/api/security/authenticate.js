// pages/api/verify-password.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  const { password } = req.body;

  // Check if the entered password matches the value in the environment variable
  if (password === process.env.ADMIN_PASSWORD2) {
    // Generate a JWT token
    const token = jwt.sign({ sessionId: 'your-session-id' }, process.env.JWT_SECRET_KEY, { expiresIn: '90d' });
    res.status(200).json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
}
