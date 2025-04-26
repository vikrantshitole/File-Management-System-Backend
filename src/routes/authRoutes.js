import express from 'express';
import { generateAuthToken, validateAuthToken } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/token
 * @desc    Generate a new JWT token
 * @access  Public
 */
router.post('/token', generateAuthToken);

/**
 * @route   GET /api/auth/validate
 * @desc    Validate a JWT token
 * @access  Public
 */
router.get('/validate', validateAuthToken);

export default router;
