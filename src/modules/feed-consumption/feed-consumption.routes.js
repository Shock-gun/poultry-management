
import { Router } from 'express';

import {
  create,
  list,
  getById,
  listByFlock
} from './feed-consumption.controller.js';

import {
  authenticate,
  authorizeRoles
} from '../auth/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', list);
router.get('/flock/:flockId', listByFlock);
router.get('/:id', getById);

router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  create
);

export default router;
