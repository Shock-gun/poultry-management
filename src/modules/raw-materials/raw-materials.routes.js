
import { Router } from 'express';

import {
  create,
  list,
  getById,
  createPurchase,
  listPurchases,
  getStockSummary
} from './raw-materials.controller.js';

import {
  authenticate,
  authorizeRoles
} from '../auth/auth.middleware.js';

const router = Router();

// All raw-material routes require authentication.
router.use(authenticate);

// List and view raw materials.
router.get('/', list);
router.get('/purchases', listPurchases);
router.get('/:id/stock', getStockSummary);
router.get('/:id', getById);

// Create materials and record purchases.
router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  create
);

router.post(
  '/purchases',
  authorizeRoles('admin', 'manager'),
  createPurchase
);

// This default export is required by app.js.
export default router;
