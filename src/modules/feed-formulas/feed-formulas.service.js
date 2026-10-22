
import pool from '../../config/db.js';

import {
  createFormula,
  addFormulaIngredients,
  findAllFormulas,
  findFormulaById,
  findRawMaterialsByIds
} from './feed-formulas.repository.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateFormula(data = {}) {
  const name =
    typeof data.name === 'string' ? data.name.trim() : '';

  const birdType = data.bird_type;
  const batchSize = Number(data.batch_size_kg);
  const description =
    typeof data.description === 'string'
      ? data.description.trim()
      : null;

  if (!name) {
    throw createError('Formula name is required.', 400);
  }

  if (name.length > 150) {
    throw createError('Formula name must not exceed 150 characters.', 400);
  }

  if (!['broiler', 'layer', 'dual_purpose'].includes(birdType)) {
    throw createError(
      'Bird type must be broiler, layer or dual_purpose.',
      400
    );
  }

  if (!Number.isFinite(batchSize) || batchSize <= 0) {
    throw createError('Batch size must be greater than zero.', 400);
  }

  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    throw createError('At least one ingredient is required.', 400);
  }

  const ingredients = data.ingredients.map((item) => {
    const rawMaterialId = item.raw_material_id;
    const quantity = Number(item.quantity_kg);

    if (!isUuid(rawMaterialId)) {
      throw createError('Every ingredient needs a valid raw_material_id.', 400);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw createError('Ingredient quantities must be greater than zero.', 400);
    }

    return {
      raw_material_id: rawMaterialId,
      quantity_kg: quantity
    };
  });

  const uniqueIds = new Set(
    ingredients.map((item) => item.raw_material_id)
  );

  if (uniqueIds.size !== ingredients.length) {
    throw createError(
      'A raw material can only appear once in a formula.',
      400
    );
  }

  const totalIngredients = ingredients.reduce(
    (total, item) => total + item.quantity_kg,
    0
  );

  if (Math.abs(totalIngredients - batchSize) > 0.001) {
    throw createError(
      `Ingredient quantities total ${totalIngredients} kg, but batch_size_kg is ${batchSize} kg.`,
      400
    );
  }

  return {
    name,
    bird_type: birdType,
    batch_size_kg: batchSize,
    description,
    ingredients
  };
}

export async function registerFormula(data, userId) {
  const formulaData = validateFormula(data);

  const rawMaterialIds = formulaData.ingredients.map(
    (item) => item.raw_material_id
  );

  const materials = await findRawMaterialsByIds(rawMaterialIds);

  if (materials.length !== rawMaterialIds.length) {
    throw createError(
      'One or more raw materials do not exist.',
      400
    );
  }

  if (materials.some((material) => !material.is_active)) {
    throw createError(
      'Inactive raw materials cannot be added to a formula.',
      400
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const formula = await createFormula(
      {
        ...formulaData,
        created_by: userId || null
      },
      client
    );

    const ingredients = await addFormulaIngredients(
      formula.id,
      formulaData.ingredients,
      client
    );

    await client.query('COMMIT');

    return {
      ...formula,
      ingredients
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw createError('A formula with this name already exists.', 409);
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function listFormulas() {
  return findAllFormulas();
}

export async function getFormulaById(id) {
  if (!isUuid(id)) {
    throw createError('Please provide a valid formula ID.', 400);
  }

  const formula = await findFormulaById(id);

  if (!formula) {
    throw createError('Feed formula not found.', 404);
  }

  return formula;
}
