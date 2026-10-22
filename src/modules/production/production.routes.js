
import { Router } from 'express';

import {
  create,
  list,
  listByFlock,
  dailySummary,
  summaryByRange
} from './production.controller.js';

import {
  authenticate,
  authorizeRoles
} from '../auth/auth.middleware.js';

const router = Router();

// All production routes require authentication
router.use(authenticate);

// GET /api/production
router.get('/', list);

router.get('/summary', dailySummary);

router.get('/summary/range', summaryByRange);

// GET /api/production/flock/:flockId
router.get('/flock/:flockId', listByFlock);

// POST /api/production
router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  create
);

export default router;
