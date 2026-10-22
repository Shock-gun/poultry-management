
import pool from '../../config/db.js';

export async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findFormulaForProduction(id, client) {
  const result = await client.query(
    `SELECT f.id, f.name, f.bird_type, f.batch_size_kg, f.is_active,
       COALESCE(json_agg(json_build_object(
         'raw_material_id', r.id,
         'raw_material_name', r.name,
         'quantity_kg', i.quantity_kg
       )) FILTER (WHERE i.id IS NOT NULL), '[]'::json) AS ingredients
     FROM feed_formulas f
     LEFT JOIN feed_formula_ingredients i ON i.formula_id = f.id
     LEFT JOIN raw_materials r ON r.id = i.raw_material_id
     WHERE f.id = $1
     GROUP BY f.id`,
    [id]
  );
  return result.rows[0] || null;
}

// Lock material rows to serialize production using the same materials.
export async function lockRawMaterials(ids, client) {
  await client.query(
    `SELECT id FROM raw_materials
     WHERE id = ANY($1::uuid[])
     ORDER BY id
     FOR UPDATE`,
    [ids]
  );
}

export async function findRawMaterialStock(id, client) {
  const result = await client.query(
    `SELECT
       COALESCE((
         SELECT SUM(p.quantity)
         FROM raw_material_purchases p
         WHERE p.raw_material_id = $1
       ), 0)::numeric AS purchased_quantity,
       COALESCE((
         SELECT SUM(i.quantity_used_kg)
         FROM feed_production_ingredients i
         JOIN raw_material_purchases p
           ON p.raw_material_id = i.raw_material_id
         WHERE i.raw_material_id = $1
       ), 0)::numeric AS placeholder_consumption`,
    [id]
  );

  // Consumption is calculated separately below; this query is replaced
  // by findRawMaterialStockAndCost to avoid counting consumption repeatedly.
  return result.rows[0];
}


export async function findRawMaterialStockAndCost(id, client) {
  const result = await client.query(
    `SELECT
       COALESCE(p.purchased_quantity, 0)::numeric AS purchased_quantity,
       COALESCE(p.purchase_value, 0)::numeric AS purchase_value,
       COALESCE(c.consumed_quantity, 0)::numeric AS consumed_quantity
     FROM (SELECT $1::uuid AS id) x
     LEFT JOIN LATERAL (
       SELECT
         SUM(quantity) AS purchased_quantity,
         SUM(quantity * unit_cost) AS purchase_value
       FROM raw_material_purchases
       WHERE raw_material_id = x.id
     ) p ON TRUE
     LEFT JOIN LATERAL (
       SELECT
         SUM(quantity_used_kg) AS consumed_quantity
       FROM feed_production_ingredients
       WHERE raw_material_id = x.id
     ) c ON TRUE`,
    [id]
  );

  const row = result.rows[0];

  const purchased = Number(row.purchased_quantity);
  const consumed = Number(row.consumed_quantity);
  const purchaseValue = Number(row.purchase_value);
  const available = purchased - consumed;

  return {
    purchasedQuantity: purchased,
    consumedQuantity: consumed,
    availableQuantity: available,
    averageCost: purchased > 0
      ? purchaseValue / purchased
      : null
  };
}


export async function createProductionBatch(data, client) {
  const result = await client.query(
    `INSERT INTO feed_production_batches (
       formula_id, batch_number, production_date,
       planned_quantity_kg, actual_quantity_kg,
       total_material_cost, cost_per_kg, notes, recorded_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      data.formula_id, data.batch_number, data.production_date,
      data.planned_quantity_kg, data.actual_quantity_kg,
      data.total_material_cost, data.cost_per_kg,
      data.notes, data.recorded_by
    ]
  );
  return result.rows[0];
}

export async function createProductionIngredient(data, client) {
  const result = await client.query(
    `INSERT INTO feed_production_ingredients (
       production_batch_id, raw_material_id,
       quantity_used_kg, unit_cost, total_cost
     ) VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      data.production_batch_id, data.raw_material_id,
      data.quantity_used_kg, data.unit_cost, data.total_cost
    ]
  );
  return result.rows[0];
}

export async function createFinishedFeedInventory(data, client) {
  const result = await client.query(
    `INSERT INTO finished_feed_inventory (
       production_batch_id, formula_id,
       quantity_produced_kg, quantity_remaining_kg, cost_per_kg
     ) VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      data.production_batch_id, data.formula_id,
      data.quantity_produced_kg, data.quantity_remaining_kg,
      data.cost_per_kg
    ]
  );
  return result.rows[0];
}

export async function findAllProductionBatches() {
  const result = await pool.query(
    `SELECT b.*, f.name AS formula_name, f.bird_type
     FROM feed_production_batches b
     JOIN feed_formulas f ON f.id = b.formula_id
     ORDER BY b.production_date DESC, b.created_at DESC`
  );
  return result.rows;
}

export async function findProductionBatchById(id) {
  const result = await pool.query(
    `SELECT b.*, f.name AS formula_name, f.bird_type
     FROM feed_production_batches b
     JOIN feed_formulas f ON f.id = b.formula_id
     WHERE b.id = $1`,
    [id]
  );

  if (!result.rows[0]) return null;

  const ingredients = await pool.query(
    `SELECT i.*, r.name AS raw_material_name
     FROM feed_production_ingredients i
     JOIN raw_materials r ON r.id = i.raw_material_id
     WHERE i.production_batch_id = $1
     ORDER BY r.name`,
    [id]
  );

  return { ...result.rows[0], ingredients: ingredients.rows };
}
