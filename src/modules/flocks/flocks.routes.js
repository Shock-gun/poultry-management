
import { Router } from 'express';

import {
  create,
  list,
  getById,
  update,
  close
} from './flocks.controller.js';

import {
  authenticate,
  authorizeRoles
} from '../auth/auth.middleware.js';

const router = Router();

// All flock routes require authentication
router.use(authenticate);

// GET /api/flocks
// Any authenticated user can list flocks
router.get('/', list);

// GET /api/flocks/:id
// Any authenticated user can view one flock
router.get('/:id', getById);

// POST /api/flocks
// Only administrators and managers can create flocks
router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  create
);

// PUT /api/flocks/:id
// Only administrators and managers can update flocks
router.put(
  '/:id',
  authorizeRoles('admin', 'manager'),
  update
);
// PATCH /api/flocks/:id/close
router.patch(
  '/:id/close',
  authorizeRoles('admin', 'manager'),
  close
);
export default router;
