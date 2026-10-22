
import {
  getFarmSummary,
  getDailyFarmReport,
} from './reports.repository.js';

function createError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateDate(value, fieldName) {
  if (!value) return;

  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw createError(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw createError(`${fieldName} is not a valid date.`);
  }
}

function validateDateRange(filters = {}) {
  const { start_date, end_date } = filters;

  validateDate(start_date, 'start_date');
  validateDate(end_date, 'end_date');

  if (start_date && end_date && start_date > end_date) {
    throw createError('start_date cannot be after end_date.');
  }

  return {
    start_date: start_date || null,
    end_date: end_date || null,
  };
}

export async function getFarmReport(filters) {
  const dates = validateDateRange(filters);
  return getFarmSummary(dates);
}

export async function getFarmDailyReport(filters) {
  const dates = validateDateRange(filters);
  return getDailyFarmReport(dates);
}
