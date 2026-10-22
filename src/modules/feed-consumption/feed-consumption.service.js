
import {
  withTransaction,
  findFlock,
  lockInventory,
  createConsumption,
  deductInventory,
  findAllConsumption,
  findConsumptionById,
  findConsumptionByFlock
} from './feed-consumption.repository.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FEED_TYPE_IDS = {
  layer: '4b4101bd-8198-41b9-a568-9b4b45d9f2ee',
  broiler: 'c317466d-02b8-4e12-a7f8-f1fc746ee990'
};

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
}

export async function recordConsumption(input, userId) {
  const flockId = String(input.flock_id || '').trim();
  const inventoryId = String(input.inventory_id || '').trim();
  const quantity = Number(input.quantity_kg);
  const date = input.consumption_date ||
    new Date().toISOString().slice(0, 10);

  if (!UUID_PATTERN.test(flockId)) {
    fail('Please provide a valid flock_id.');
  }

  if (!UUID_PATTERN.test(inventoryId)) {
    fail('Please provide a valid inventory_id.');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    fail('quantity_kg must be a positive number.');
  }

  if (Math.round(quantity * 1000) !== quantity * 1000) {
    fail('quantity_kg can have at most 3 decimal places.');
  }

  if (!validDate(date)) {
    fail('consumption_date must be a valid YYYY-MM-DD date.');
  }

  return withTransaction(async (client) => {
    const flock = await findFlock(flockId, client);

    if (!flock) {
      fail('Flock was not found.', 404);
    }

    const inventory = await lockInventory(inventoryId, client);

    if (!inventory) {
      fail('Finished-feed inventory batch was not found.', 404);
    }

    // Determine the feed type from the inventory's formula.
    const birdType = String(inventory.bird_type || '').toLowerCase();
    const feedTypeId = FEED_TYPE_IDS[birdType];

    if (!feedTypeId) {
      fail(`Unsupported feed bird type: ${birdType}`);
    }

    const available = Number(inventory.quantity_remaining_kg);
    const costPerKg = Number(inventory.cost_per_kg);

    if (!Number.isFinite(available) || available < quantity) {
      fail(
        `Insufficient finished feed stock. Available: ${available.toFixed(3)} kg; required: ${quantity.toFixed(3)} kg.`,
        409
      );
    }

    if (!Number.isFinite(costPerKg) || costPerKg < 0) {
      fail('The inventory has an invalid feed cost.');
    }

    const consumption = await createConsumption(
      {
        flock_id: flockId,
        feed_type_id: feedTypeId,
        inventory_id: inventoryId,
        consumption_date: date,
        quantity_kg: quantity,
        cost_per_kg: costPerKg,
        notes: input.notes || null,
        recorded_by: userId || null
      },
      client
    );

    const updatedInventory = await deductInventory(
      inventoryId,
      quantity,
      client
    );

    if (!updatedInventory) {
      fail('Could not deduct feed from inventory.', 409);
    }

    return {
      consumption,
      inventory: updatedInventory
    };
  });
}

export async function listConsumption() {
  return findAllConsumption();
}

export async function getConsumption(id) {
  if (!UUID_PATTERN.test(String(id || ''))) {
    fail('Please provide a valid consumption ID.');
  }

  const record = await findConsumptionById(id);

  if (!record) {
    fail('Feed consumption record was not found.', 404);
  }

  return record;
}

export async function listConsumptionByFlock(flockId) {
  if (!UUID_PATTERN.test(String(flockId || ''))) {
    fail('Please provide a valid flock ID.');
  }

  return findConsumptionByFlock(flockId);
}
