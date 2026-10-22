
import {
  createRawMaterial,
  findAllRawMaterials,
  findRawMaterialById,
  createRawMaterialPurchase,
  findRawMaterialPurchases,
  getRawMaterialPurchaseSummary
} from './raw-materials.repository.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isValidUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Register a new raw material.
export async function registerRawMaterial(data = {}) {
  const name =
    typeof data.name === 'string' ? data.name.trim() : '';

  const baseUnit = data.base_unit ?? 'kg';
  const description =
    typeof data.description === 'string'
      ? data.description.trim()
      : null;

  if (!name) {
    throw createError('Raw material name is required.', 400);
  }

  if (name.length > 150) {
    throw createError('Name must not exceed 150 characters.', 400);
  }

  if (!['kg', 'litre', 'piece'].includes(baseUnit)) {
    throw createError(
      'Base unit must be kg, litre or piece.',
      400
    );
  }

  try {
    return await createRawMaterial({
      name,
      base_unit: baseUnit,
      description
    });
  } catch (error) {
    if (error.code === '23505') {
      throw createError(
        'A raw material with this name already exists.',
        409
      );
    }
    throw error;
  }
}

// List all raw materials.
export async function listRawMaterials() {
  return findAllRawMaterials();
}

// Get one raw material.
export async function getRawMaterialById(id) {
  if (!isValidUuid(id)) {
    throw createError('Please provide a valid raw material ID.', 400);
  }

  const material = await findRawMaterialById(id);

  if (!material) {
    throw createError('Raw material not found.', 404);
  }

  return material;
}

// Record a purchase.
export async function recordRawMaterialPurchase(data = {}, userId) {
  const materialId = data.raw_material_id;
  const quantity = Number(data.quantity);
  const unitCost = Number(data.unit_cost);
  const purchaseDate = data.purchase_date;
  const supplierName =
    typeof data.supplier_name === 'string'
      ? data.supplier_name.trim()
      : null;
  const notes =
    typeof data.notes === 'string' ? data.notes.trim() : null;

  if (!isValidUuid(materialId)) {
    throw createError('Please provide a valid raw_material_id.', 400);
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw createError('Quantity must be greater than zero.', 400);
  }

  if (!Number.isFinite(unitCost) || unitCost < 0) {
    throw createError('Unit cost cannot be negative.', 400);
  }

  if (
    purchaseDate !== undefined &&
    (typeof purchaseDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate) ||
      Number.isNaN(Date.parse(`${purchaseDate}T00:00:00Z`)) ||
      new Date(`${purchaseDate}T00:00:00Z`).toISOString().slice(0, 10) !== purchaseDate)
  ) {
    throw createError('Purchase date must be a valid YYYY-MM-DD date.', 400);
  }

  const material = await findRawMaterialById(materialId);

  if (!material) {
    throw createError('Raw material not found.', 404);
  }

  return createRawMaterialPurchase({
    raw_material_id: materialId,
    purchase_date: purchaseDate || null,
    supplier_name: supplierName,
    quantity,
    unit_cost: unitCost,
    notes,
    recorded_by: userId || null
  });
}

// List purchases, optionally filtered by raw material.
export async function listRawMaterialPurchases(rawMaterialId = null) {
  if (rawMaterialId !== null && !isValidUuid(rawMaterialId)) {
    throw createError('Please provide a valid raw material ID.', 400);
  }

  if (rawMaterialId) {
    const material = await findRawMaterialById(rawMaterialId);

    if (!material) {
      throw createError('Raw material not found.', 404);
    }
  }

  return findRawMaterialPurchases(rawMaterialId);
}

// Summarize purchases and weighted-average purchase cost.
export async function getRawMaterialStockSummary(id) {
  if (!isValidUuid(id)) {
    throw createError('Please provide a valid raw material ID.', 400);
  }

  const material = await findRawMaterialById(id);

  if (!material) {
    throw createError('Raw material not found.', 404);
  }

  return getRawMaterialPurchaseSummary(id);
}
