import { generateToken, validateToken } from '../services/jwtService.js';
import { logger } from '../utils/logger.js';

/**
 * Generate a new JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateAuthToken = async (req, res, next) => {
  try {
    const token = generateToken();

    logger.info('New authentication token generated');
    res.status(200).json({
      success: true,
      token,
      message: 'Token generated successfully',
    });
  } catch (error) {
    logger.error('Error generating authentication token:', error);
    next({
      status: 'error',
      statusCode: 500,
      message: 'Error generating authentication token',
      code: 'AUTH_TOKEN_GENERATION_ERROR',
    });
  }
};

/**
 * Validate a JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const validateAuthToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    const validationResult = validateToken(token);

    if (!validationResult.isValid) {
      return next({
        status: 'error',
        statusCode: 401,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    logger.info('Token validated successfully');
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        expiresAt: validationResult.expiresAt,
        decoded: validationResult.decoded,
      },
    });
  } catch (error) {
    logger.error('Error validating token:', error);
    return next({
      status: 'error',
      statusCode: 500,
      message: 'Error validating token',
      code: 'TOKEN_VALIDATION_ERROR',
    });
  }
};
