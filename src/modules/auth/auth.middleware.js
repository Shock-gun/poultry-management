
import 'dotenv/config';
import jwt from 'jsonwebtoken';

import {
  getActiveUserById
} from './auth.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be configured with a strong secret of at least 32 characters.'
  );
}

// Verify the token and identify the current user
export async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }

    const token = authorization.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === 'string' || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    const user = await getActiveUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or inactive'
      });
    }

    // Store the current user for later middleware/controllers
    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token'
      });
    }

    next(error);
  }
}

// Check whether the current user has an allowed role
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Authentication must run before authorization
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
}
