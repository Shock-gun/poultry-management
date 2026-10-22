
import { Router } from 'express';

import { authenticate } from '../auth/auth.middleware.js';

import {
  getOverview,
  getRawMaterials,
  getFinishedFeed,
} from './inventory.controller.js';

const router = Router();

// All inventory endpoints require authentication.
router.use(authenticate);

router.get('/', getOverview);
router.get('/raw-materials', getRawMaterials);
router.get('/finished-feed', getFinishedFeed);

export default router;
