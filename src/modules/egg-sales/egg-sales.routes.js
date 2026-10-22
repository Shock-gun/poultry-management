
import { Router } from 'express';

import {
  authenticate,
  authorizeRoles,
} from '../auth/auth.middleware.js';

import {
  createSale,
  listSales,
  getSaleById,
  getSalesSummary,
} from './egg-sales.controller.js';

const router = Router();

router.use(authenticate);

// Record a new egg sale.
router.post(
  '/',
  authorizeRoles('admin', 'manager', 'staff'),
  createSale
);

// Keep summary before the /:id route.
router.get('/summary', getSalesSummary);

// List sales, optionally filtered by date.
router.get('/', listSales);

// Get one sale.
router.get('/:id', getSaleById);

export default router;
