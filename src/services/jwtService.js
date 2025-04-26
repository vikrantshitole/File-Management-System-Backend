import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token
 * @returns {string} JWT token
 */
export const generateToken = () => {
  try {
    const token = jwt.sign(
      {
        // Add any system-specific claims here
        system: 'file-management-system',
        timestamp: Date.now(),
        api_key: process.env.API_KEY,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    logger.info('JWT token generated successfully');
    return token;
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = token => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.api_key !== process.env.API_KEY) {
      throw new Error('Invalid token');
    }

    logger.info('JWT token verified successfully');
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT token:', error);
    throw new Error('Invalid token');
  }
};

/**
 * Validate a JWT token
 * @param {string} token - JWT token to validate
 * @returns {Object} Validation result
 */
export const validateToken = token => {
  try {
    if (!token) {
      return {
        isValid: false,
        error: 'No token provided',
      };
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.api_key !== process.env.API_KEY) {
      throw new Error('Invalid token');
    }

    return {
      isValid: true,
      decoded,
      expiresAt: new Date(decoded.exp * 1000),
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
    };
  }
};

/**
 * Middleware to verify JWT token in requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.query.token;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next({
        status: 'error',
        statusCode: 401,
        message: 'No token provided',
        code: 'NO_TOKEN_PROVIDED',
      });
    }

    const decoded = verifyToken(token);
    req.token = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return next({
      status: 'error',
      statusCode: 403,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};
