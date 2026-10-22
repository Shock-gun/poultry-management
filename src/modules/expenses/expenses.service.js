
import {
  createExpense,
  findAllExpenses,
  findExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} from './expenses.repository.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_CATEGORIES = [
  'labour',
  'veterinary',
  'medicine',
  'vaccines',
  'transport',
  'electricity',
  'water',
  'repairs',
  'equipment',
  'packaging',
  'other'
];

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function validateDate(value, fieldName) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    fail(`${fieldName} must be a valid YYYY-MM-DD date.`);
  }
}

function validateExpense(data, partial = false) {
  const result = {};

  if (!partial || data.category !== undefined) {
    if (typeof data.category !== 'string') {
      fail('Expense category is required.');
    }

    const category = data.category.trim().toLowerCase();

    if (!ALLOWED_CATEGORIES.includes(category)) {
      fail(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
    }

    result.category = category;
  }

  if (!partial || data.amount !== undefined) {
    const amount = Number(data.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      fail('Expense amount must be greater than zero.');
    }

    result.amount = Math.round(amount * 100) / 100;
  }

  if (!partial || data.flock_id !== undefined) {
    const flockId = data.flock_id || null;

    if (flockId !== null &&
        (typeof flockId !== 'string' || !UUID_PATTERN.test(flockId))) {
      fail('Please provide a valid flock_id.');
    }

    result.flock_id = flockId;
  }

  if (!partial || data.expense_date !== undefined) {
    const expenseDate = data.expense_date || null;

    if (expenseDate !== null) {
      validateDate(expenseDate, 'expense_date');
    }

    result.expense_date = expenseDate;
  }

  if (!partial || data.description !== undefined) {
    if (
      data.description !== undefined &&
      data.description !== null &&
      typeof data.description !== 'string'
    ) {
      fail('Description must be text.');
    }

    result.description =
      typeof data.description === 'string'
        ? data.description.trim() || null
        : null;
  }

  return result;
}

export async function registerExpense(data = {}, userId) {
  const expense = validateExpense(data);

  if (expense.flock_id) {
    const { findFlock } = await import('../feed-consumption/feed-consumption.repository.js');

    // This helper accepts a transaction client, so use a direct flock lookup
    // here through the database repository in the next refinement if needed.
    // Do not call it without a client.
  }

  return createExpense({
    ...expense,
    recorded_by: userId || null
  });
}

export async function listExpenses(filters = {}) {
  if (filters.start_date) {
    validateDate(filters.start_date, 'start_date');
  }

  if (filters.end_date) {
    validateDate(filters.end_date, 'end_date');
  }

  if (
    filters.start_date &&
    filters.end_date &&
    filters.start_date > filters.end_date
  ) {
    fail('start_date cannot be later than end_date.');
  }

  if (filters.flock_id && !UUID_PATTERN.test(filters.flock_id)) {
    fail('Please provide a valid flock_id.');
  }

  const category = filters.category
    ? String(filters.category).trim().toLowerCase()
    : null;

  if (category && !ALLOWED_CATEGORIES.includes(category)) {
    fail('Invalid expense category.');
  }

  return findAllExpenses({
    ...filters,
    category
  });
}

export async function getExpense(id) {
  if (!UUID_PATTERN.test(String(id || ''))) {
    fail('Please provide a valid expense ID.');
  }

  const expense = await findExpenseById(id);

  if (!expense) {
    fail('Expense not found.', 404);
  }

  return expense;
}

export async function editExpense(id, data = {}) {
  if (!UUID_PATTERN.test(String(id || ''))) {
    fail('Please provide a valid expense ID.');
  }

  const existing = await findExpenseById(id);

  if (!existing) {
    fail('Expense not found.', 404);
  }

  const expense = validateExpense(data, true);
  const merged = {
    flock_id: expense.flock_id ?? existing.flock_id,
    category: expense.category ?? existing.category,
    amount: expense.amount ?? Number(existing.amount),
    expense_date: expense.expense_date ?? existing.expense_date,
    description: expense.description !== undefined
      ? expense.description
      : existing.description
  };

  return updateExpense(id, merged);
}

export async function removeExpense(id) {
  if (!UUID_PATTERN.test(String(id || ''))) {
    fail('Please provide a valid expense ID.');
  }

  const deleted = await deleteExpense(id);

  if (!deleted) {
    fail('Expense not found.', 404);
  }

  return deleted;
}

export async function summarizeExpenses(startDate, endDate) {
  validateDate(startDate, 'start_date');
  validateDate(endDate, 'end_date');

  if (startDate > endDate) {
    fail('start_date cannot be later than end_date.');
  }

  return getExpenseSummary(startDate, endDate);
}
