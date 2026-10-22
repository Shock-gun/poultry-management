
import { Router } from 'express';
import {
  authenticate,
  authorizeRoles
} from '../auth/auth.middleware.js';
import {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} from './expenses.controller.js';

const router = Router();

// All expense endpoints require authentication.
router.use(authenticate);

// Create an expense.
router.post(
  '/',
  authorizeRoles('admin', 'manager'),
  createExpense
);

// List expenses.
router.get('/', getExpenses);

// Get expense summary.
// Keep this route before /:id.
router.get('/summary', getExpenseSummary);

// Get one expense.
router.get('/:id', getExpense);

// Update an expense.
router.put(
  '/:id',
  authorizeRoles('admin', 'manager'),
  updateExpense
);

// Delete an expense.
router.delete(
  '/:id',
  authorizeRoles('admin', 'manager'),
  deleteExpense
);

export default router;
