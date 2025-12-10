import authService from '../services/authService.js';
import { asyncHandler, sendSuccess, sendError, sendValidationError } from '../utils/responseHandler.js';
import { connectToMongoDB } from '../config/database.js';

/**
 * Auth Controller - Handles authentication routes
 */
class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/signup
   */
  signup = asyncHandler(async (req, res) => {
    console.log('Signup request received:', new Date().toISOString());
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log('Signup attempt failed: Missing required fields');
      return sendValidationError(res, ['All fields are required']);
    }

    // Connect to MongoDB if not already connected
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('MongoDB connection failed during signup');
      return sendError(res, 'Database service unavailable', 503);
    }

    try {
      console.log(`Attempting signup for email: ${email}`);
      const result = await authService.signup({ name, email, password });
      console.log(`Signup successful for user: ${email}`);
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message === 'User already exists') {
        return sendError(res, error.message, 400);
      }
      return sendError(res, 'Signup failed', 500, error);
    }
  });

  /**
   * Login user
   * @route POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    console.log('Login request received:', new Date().toISOString());
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Login attempt failed: Missing email or password');
      return sendValidationError(res, ['Email and password are required']);
    }

    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      return sendError(res, 'Database service unavailable', 503);
    }

    try {
      console.log(`Attempting login for email: ${email}`);
      const result = await authService.login({ email, password });
      console.log(`Login successful for user: ${email}`);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);
      if (error.message === 'Invalid credentials') {
        return sendError(res, error.message, 401);
      }
      return sendError(res, 'Login failed', 500, error);
    }
  });

  /**
   * Get current user profile
   * @route GET /api/auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    try {
      const user = await authService.getUserById(req.user.id);
      return sendSuccess(res, { user }, 'User profile retrieved successfully');
    } catch (error) {
      console.error('Get user error:', error);
      if (error.message === 'User not found') {
        return sendError(res, error.message, 404);
      }
      return sendError(res, 'Failed to retrieve user profile', 500, error);
    }
  });

  /**
   * Verify token validity
   * @route POST /api/auth/verify-token
   */
  verifyToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return sendValidationError(res, ['Token is required']);
    }

    try {
      // This would typically verify the token and return user info
      // For now, we'll use the user from the request if authenticated
      if (req.user) {
        const user = await authService.verifyToken(req.user.id);
        return sendSuccess(res, { valid: true, user }, 'Token is valid');
      }
      return sendError(res, 'Invalid token', 401);
    } catch (error) {
      console.error('Token verification error:', error);
      return sendError(res, 'Token verification failed', 401, error);
    }
  });
}

export default new AuthController();
