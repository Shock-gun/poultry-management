
import {
  createEggSale as saveEggSale,
  findEggSales,
  findEggSaleById,
  getEggSalesSummary,
} from './egg-sales.repository.js';

function badRequest(message) {
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
    throw badRequest(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw badRequest(`${fieldName} is not a valid date.`);
  }
}

function validateFilters(filters = {}) {
  validateDate(filters.start_date, 'start_date');
  validateDate(filters.end_date, 'end_date');

  if (
    filters.start_date &&
    filters.end_date &&
    filters.start_date > filters.end_date
  ) {
    throw badRequest('start_date cannot be after end_date.');
  }

  return {
    start_date: filters.start_date || null,
    end_date: filters.end_date || null,
  };
}

export async function recordEggSale(data, userId) {
  const quantity = Number(data.quantity_eggs);
  const price = Number(data.price_per_egg);

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    throw badRequest('quantity_eggs must be a positive whole number.');
  }

  if (
    data.price_per_egg === undefined ||
    data.price_per_egg === null ||
    data.price_per_egg === '' ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw badRequest('price_per_egg must be a valid non-negative number.');
  }

  if (price > 9999999999.99) {
    throw badRequest('price_per_egg is too large.');
  }

  if (data.flock_id) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(data.flock_id)) {
      throw badRequest('flock_id must be a valid UUID.');
    }
  }

  validateDate(data.sale_date, 'sale_date');

  if (data.buyer_name && data.buyer_name.length > 150) {
    throw badRequest('buyer_name cannot exceed 150 characters.');
  }

  return saveEggSale({
    ...data,
    quantity_eggs: quantity,
    price_per_egg: price,
    recorded_by: userId || null,
  });
}

export async function listEggSales(filters) {
  return findEggSales(validateFilters(filters));
}

export async function getEggSale(id) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    throw badRequest('Sale ID must be a valid UUID.');
  }

  const sale = await findEggSaleById(id);

  if (!sale) {
    const error = new Error('Egg sale not found.');
    error.statusCode = 404;
    throw error;
  }

  return sale;
}

export async function summarizeEggSales(filters) {
  return getEggSalesSummary(validateFilters(filters));
}
