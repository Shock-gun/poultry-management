
import {
  createFlock,
  findAllFlocks,
  findFlockById,
    updateFlock,
    closeFlock
} from './flocks.repository.js';

const ALLOWED_BIRD_TYPES = [
  'broiler',
  'layer',
  'dual_purpose'
];

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateFlockData(data = {}) {
  const name =
    typeof data.name === 'string'
      ? data.name.trim()
      : '';

  const breed =
    typeof data.breed === 'string'
      ? data.breed.trim()
      : '';

  const birdType = data.bird_type;

  const quantity = data.initial_quantity;
  const acquisitionDate = data.acquisition_date;

  if (!name || !breed || !birdType || !acquisitionDate) {
    throw createError(
      'Name, breed, bird type and acquisition date are required.',
      400
    );
  }

  if (name.length > 120 || breed.length > 100) {
    throw createError(
      'Name must not exceed 120 characters and breed must not exceed 100 characters.',
      400
    );
  }

  if (!ALLOWED_BIRD_TYPES.includes(birdType)) {
    throw createError(
      'Bird type must be broiler, layer or dual_purpose.',
      400
    );
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    throw createError(
      'Initial quantity must be a positive whole number.',
      400
    );
  }

  if (
    typeof acquisitionDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(acquisitionDate)
  ) {
    throw createError(
      'Acquisition date must use YYYY-MM-DD format.',
      400
    );
  }

  const parsedDate = new Date(
    `${acquisitionDate}T00:00:00.000Z`
  );

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== acquisitionDate
  ) {
    throw createError(
      'Please provide a valid acquisition date.',
      400
    );
  }

  return {
    name,
    breed,
    bird_type: birdType,
    initial_quantity: quantity,
    acquisition_date: acquisitionDate
  };
}

// Create a flock
export async function registerFlock(data, userId) {
  const flockData = validateFlockData(data);

  try {
    return await createFlock({
      ...flockData,
      created_by: userId
    });
  } catch (error) {
    throw error;
  }
}

// Get all flocks

/**
 * Update editable details of an active flock.
 */
export async function editFlock(id, data = {}) {
  // Ensure the flock exists before updating it
  const existingFlock = await findFlockById(id);

  if (!existingFlock) {
    throw createError('Flock not found.', 404);
  }

  if (existingFlock.status !== 'active') {
    throw createError(
      'A closed flock cannot be updated.',
      409
    );
  }

  // Validate the updated fields
  const flockData = validateFlockData({
    name: data.name,
    breed: data.breed,
    bird_type: data.bird_type,
    initial_quantity: existingFlock.initial_quantity,
    acquisition_date: data.acquisition_date
  });

  // Update only the permitted fields
  const updatedFlock = await updateFlock(id, {
    name: flockData.name,
    breed: flockData.breed,
    bird_type: flockData.bird_type,
    acquisition_date: flockData.acquisition_date
  });

  if (!updatedFlock) {
    throw createError(
      'Flock could not be updated.',
      409
    );
  }

  return updatedFlock;
}


export async function listFlocks() {
  return findAllFlocks();
}

// Get a flock by ID
export async function getFlockById(id) {
  const flock = await findFlockById(id);

  if (!flock) {
    throw createError('Flock not found.', 404);
  }

  return flock;
}


 // Close an active flock
export async function finishFlock(id) {
  const flock = await findFlockById(id);

  if (!flock) {
    throw createError('Flock not found.', 404);
  }

  if (flock.status !== 'active') {
    throw createError('Flock is already closed.', 409);
  }

  const closedFlock = await closeFlock(id);

  if (!closedFlock) {
    throw createError(
      'Flock could not be closed.',
      409
    );
  }

  return closedFlock;
}

