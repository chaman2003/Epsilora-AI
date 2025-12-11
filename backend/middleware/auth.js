import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { connectToMongoDB } from '../config/database.js';

/**
 * Authentication middleware with on-demand MongoDB connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('No token provided in Authorization header');
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    // Connect to MongoDB first if needed
    const connected = await connectToMongoDB();
    if (!connected) {
      return res.status(503).json({ message: 'Database unavailable' });
    }

    // Clean token if it has quotes (shouldn't happen but just in case)
    const cleanToken = typeof token === 'string' ? token.replace(/^["']|["']$/g, '').trim() : token;
    const user = jwt.verify(cleanToken, config.jwtSecret);
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    console.error('Token received:', token);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: String(user._id),
      email: user.email,
      name: user.name 
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

export default { authenticateToken, generateToken };
