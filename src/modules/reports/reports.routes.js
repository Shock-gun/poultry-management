
import { Router } from 'express';

import { authenticate } from '../auth/auth.middleware.js';

import {
  getSummary,
  getDailyReport,
} from './reports.controller.js';

import {
  downloadFarmReportPdf,
} from './reports.pdf.controller.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/daily', getDailyReport);
router.get('/pdf', downloadFarmReportPdf);

export default router;
