
import { Router } from 'express';

import {
  create,
  list,
  getById
} from './feed-formulas.controller.js';

import {
  authenticate,
  authorizeRoles
} from '../auth/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', list);
router.get('/:id', getById);

router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  create
);

export default router;
