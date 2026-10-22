
import {
  createProduction,
  findAllProduction,
  findProductionByFlock,
  getDailyProductionSummary,
  getProductionSummaryByDateRange
} from './production.repository.js';

import { findFlockById } from '../flocks/flocks.repository.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateFlockId(id) {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw createError('Please provide a valid flock ID.', 400);
  }
}

function validateProductionData(data = {}) {
  const { flock_id, production_date, eggs_collected } = data;

  const broken_eggs =
    data.broken_eggs === undefined ? 0 : data.broken_eggs;

  const notes =
    data.notes === undefined || data.notes === null
      ? null
      : data.notes;

  validateFlockId(flock_id);

  if (
    typeof production_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(production_date)
  ) {
    throw createError(
      'Production date must use YYYY-MM-DD format.',
      400
    );
  }

  const parsedDate = new Date(`${production_date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== production_date
  ) {
    throw createError('Please provide a valid production date.', 400);
  }

  if (
    !Number.isSafeInteger(eggs_collected) ||
    eggs_collected < 0
  ) {
    throw createError(
      'Eggs collected must be a non-negative whole number.',
      400
    );
  }

  if (
    !Number.isSafeInteger(broken_eggs) ||
    broken_eggs < 0 ||
    broken_eggs > eggs_collected
  ) {
    throw createError(
      'Broken eggs must be a whole number between zero and eggs collected.',
      400
    );
  }

  if (notes !== null && typeof notes !== 'string') {
    throw createError('Notes must be text.', 400);
  }

  if (typeof notes === 'string' && notes.length > 2000) {
    throw createError('Notes must not exceed 2000 characters.', 400);
  }

  return {
    flock_id,
    production_date,
    eggs_collected,
    broken_eggs,
    notes: typeof notes === 'string' ? notes.trim() || null : null
  };
}

export async function recordProduction(data, userId) {
  const productionData = validateProductionData(data);

  const flock = await findFlockById(productionData.flock_id);

  if (!flock) {
    throw createError('Flock not found.', 404);
  }

  if (flock.status !== 'active') {
    throw createError(
      'Egg production cannot be recorded for a closed flock.',
      409
    );
  }

  try {
    return await createProduction({
      ...productionData,
      recorded_by: userId
    });
  } catch (error) {
    if (error.code === '23505') {
      throw createError(
        'A production record already exists for this flock and date.',
        409
      );
    }

    throw error;
  }
}

export async function listProduction() {
  return findAllProduction();
}

export async function listProductionByFlock(flockId) {
  validateFlockId(flockId);

  const flock = await findFlockById(flockId);

  if (!flock) {
    throw createError('Flock not found.', 404);
  }

  return findProductionByFlock(flockId);
}

export async function getDailySummary(date) {
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    const error = new Error(
      'Please provide a date in YYYY-MM-DD format.'
    );
    error.statusCode = 400;
    throw error;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    const error = new Error('Please provide a valid date.');
    error.statusCode = 400;
    throw error;
  }

  return getDailyProductionSummary(date);
}
export async function getProductionSummaryByRange(startDate, endDate) {
  function isValidDate(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return false;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date
    );
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    const error = new Error(
      'Please provide valid startDate and endDate values in YYYY-MM-DD format.'
    );
    error.statusCode = 400;
    throw error;
  }

  if (startDate > endDate) {
    const error = new Error('startDate must be on or before endDate.');
    error.statusCode = 400;
    throw error;
  }

  const summary = await getProductionSummaryByDateRange(startDate, endDate);

  return {
    ...summary,
    flocks_count: new Set(
      summary.daily_totals.flatMap(day => day.flock_ids ?? [])
    ).size
  };
}
