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
  console.log('[Auth Middleware] Authorization header:', authHeader ? 'present' : 'missing');
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('[Auth Middleware] Token extracted:', token ? `${token.substring(0, 20)}...` : 'undefined');

  if (!token) {
    console.warn('[Auth Middleware] No token provided in Authorization header');
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
    console.log('[Auth Middleware] Token cleaned, attempting verification');
    
    const user = jwt.verify(cleanToken, config.jwtSecret);
    console.log('[Auth Middleware] Token verified successfully, user:', user.email);
    
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token verification error:', error.message);
    console.error('[Auth Middleware] Token (first 30 chars):', token.substring(0, 30));
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
