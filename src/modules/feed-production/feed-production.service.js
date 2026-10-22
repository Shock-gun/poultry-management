
import { randomUUID } from 'node:crypto';
import {
  withTransaction,
  findFormulaForProduction,
  lockRawMaterials,
  findRawMaterialStockAndCost,
  createProductionBatch,
  createProductionIngredient,
  createFinishedFeedInventory,
  findAllProductionBatches,
  findProductionBatchById
} from './feed-production.repository.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export async function produceFeed(input, userId) {
  const formulaId = String(input.formula_id || '').trim();
  const planned = Number(input.planned_quantity_kg);
  const actual = Number(input.actual_quantity_kg);
  const productionDate = input.production_date || new Date().toISOString().slice(0, 10);

  if (!UUID_PATTERN.test(formulaId)) fail('Please provide a valid formula_id.');
  if (!Number.isFinite(planned) || planned <= 0) {
    fail('planned_quantity_kg must be greater than zero.');
  }
  if (!Number.isFinite(actual) || actual <= 0) {
    fail('actual_quantity_kg must be greater than zero.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(productionDate) ||
      Number.isNaN(Date.parse(`${productionDate}T00:00:00Z`))) {
    fail('production_date must use YYYY-MM-DD format.');
  }

  return withTransaction(async (client) => {
    const formula = await findFormulaForProduction(formulaId, client);

    if (!formula) fail('Feed formula was not found.', 404);
    if (!formula.is_active) fail('This feed formula is inactive.');
    if (!formula.ingredients.length) fail('This formula has no ingredients.');

    const formulaSize = Number(formula.batch_size_kg);
    if (!Number.isFinite(formulaSize) || formulaSize <= 0) {
      fail('The formula has an invalid batch size.', 500);
    }

    const ingredients = formula.ingredients;
    const materialIds = ingredients.map((item) => item.raw_material_id);

    await lockRawMaterials(materialIds, client);

    // Scale recipe quantities to the actual amount manufactured.
    const scale = actual / formulaSize;
    const ingredientLines = [];

    for (const ingredient of ingredients) {
      const recipeQuantity = Number(ingredient.quantity_kg);
      const quantityUsed = Math.round(recipeQuantity * scale * 1000) / 1000;

      const stock = await findRawMaterialStockAndCost(
        ingredient.raw_material_id,
        client
      );

      if (stock.averageCost === null || stock.availableQuantity < quantityUsed - 0.0001) {
        fail(
          `Insufficient stock for ${ingredient.raw_material_name}. ` +
          `Available: ${stock.availableQuantity.toFixed(3)} kg; ` +
          `required: ${quantityUsed.toFixed(3)} kg. Record purchases first.`,
          409
        );
      }

      ingredientLines.push({
        raw_material_id: ingredient.raw_material_id,
        quantity_used_kg: quantityUsed,
        unit_cost: stock.averageCost
      });
    }

    const totalCost = ingredientLines.reduce(
      (sum, line) => sum + line.quantity_used_kg * line.unit_cost,
      0
    );
    const roundedTotalCost = Math.round(totalCost * 100) / 100;
    const costPerKg = roundedTotalCost / actual;
    const batchNumber = `FP-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const batch = await createProductionBatch({
      formula_id: formulaId,
      batch_number: batchNumber,
      production_date: productionDate,
      planned_quantity_kg: planned,
      actual_quantity_kg: actual,
      total_material_cost: roundedTotalCost,
      cost_per_kg: costPerKg,
      notes: input.notes || null,
      recorded_by: userId || null
    }, client);

    for (const line of ingredientLines) {
      await createProductionIngredient({
        production_batch_id: batch.id,
        raw_material_id: line.raw_material_id,
        quantity_used_kg: line.quantity_used_kg,
        unit_cost: line.unit_cost,
        total_cost: Math.round(
          line.quantity_used_kg * line.unit_cost * 100
        ) / 100
      }, client);
    }

    const inventory = await createFinishedFeedInventory({
      production_batch_id: batch.id,
      formula_id: formulaId,
      quantity_produced_kg: actual,
      quantity_remaining_kg: actual,
      cost_per_kg: costPerKg
    }, client);

    return {
      batch,
      ingredients: ingredientLines,
      inventory
    };
  });
}

export async function listProductionBatches() {
  return findAllProductionBatches();
}

export async function getProductionBatch(id) {
  if (!UUID_PATTERN.test(String(id || ''))) {
    fail('Please provide a valid production batch ID.');
  }

  const batch = await findProductionBatchById(id);
  if (!batch) fail('Production batch not found.', 404);
  return batch;
}
