// pages/api/verify-token.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    res.status(200).json({ success: true, decoded });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
