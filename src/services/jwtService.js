import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN) || 1;

/**
 * Generate a JWT token
 * @returns {string} JWT token
 */
export const generateToken = () => {
  try {
    console.log(JWT_EXPIRES_IN,typeof JWT_EXPIRES_IN);
    const token = jwt.sign(
      {
        // Add any system-specific claims here
        system: 'file-management-system',
        timestamp: Date.now(),
        api_key: process.env.API_KEY,
        expires_at: new Date().setDate(new Date().getDate() + JWT_EXPIRES_IN),
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
    if (decoded.expires_at < Date.now()) {
      throw new Error('Token has expired');
    }
    logger.info('JWT token verified successfully');
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token has expired');
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token format');
      throw new Error('Invalid token format');
    }
    logger.error('Error verifying JWT token:', error);
    throw error;
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
        code: 'NO_TOKEN_PROVIDED'
      };
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.api_key !== process.env.API_KEY) {
      return {
        isValid: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      };
    }
    if (decoded.expires_at < Date.now()) {
      return {
        isValid: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      };
    }
    return {
      isValid: true,
      decoded,
      expiresAt: new Date(decoded.exp * 1000),
      code: 'TOKEN_VALID'
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        isValid: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      };
    }
    if (error.name === 'JsonWebTokenError') {
      return {
        isValid: false,
        error: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      };
    }
    return {
      isValid: false,
      error: error.message,
      code: 'TOKEN_VALIDATION_ERROR'
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
        code: 'NO_TOKEN_PROVIDED'
      });
    }

    const decoded = verifyToken(token);
    req.token = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error.message === 'Token has expired') {
      return next({
        status: 'error',
        statusCode: 401,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return next({
      status: 'error',
      statusCode: 403,
      message: error.message || 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};
