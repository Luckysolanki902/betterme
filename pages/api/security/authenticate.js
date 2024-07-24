// api/admin/security/authenticate.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { password1, password2 } = req.body;

      const adminPassword1 = process.env.ADMIN_PASSWORD1;
      const adminPassword2 = process.env.ADMIN_PASSWORD2;

      if (password1 === adminPassword1 && password2 === adminPassword2) {
        const secretKey = process.env.JWT_SECRET_KEY || 'default_secret_key'; // Use a default if not set
        const token = jwt.sign({ isAdmin: true }, secretKey);
        return res.status(200).json({ success: true, token: token });
      } else {
        return res.status(401).json({ success: false, message: 'Passwords do not match the admin credentials.' });
      }
    } catch (error) {
      console.error('Error granting admin access:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else if (req.method === 'GET') {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    try {
      const secretKey = process.env.JWT_SECRET_KEY || 'default_secret_key';
      const decodedToken = jwt.verify(token, secretKey);

      // Check if the decoded token has the expected properties
      if (decodedToken && decodedToken.isAdmin) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid token or insufficient privileges.' });
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ success: false, message: 'Invalid token or insufficient privileges.' });
    }
  } else {
    return res.status(405).end(); // Method Not Allowed
  }
}
