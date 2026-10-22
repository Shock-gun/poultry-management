
import pool from '../../config/db.js';

export async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Transaction rollback failed:', rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function findFlock(id, client) {
  const result = await client.query(
    `SELECT id, name
     FROM flocks
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

export async function lockInventory(id, client) {
  const result = await client.query(
    `SELECT
       fi.id,
       fi.formula_id,
       fi.quantity_produced_kg,
       fi.quantity_remaining_kg,
       fi.cost_per_kg,
       ff.bird_type
     FROM finished_feed_inventory fi
     JOIN feed_formulas ff ON ff.id = fi.formula_id
     WHERE fi.id = $1
     FOR UPDATE OF fi`,
    [id]
  );

  return result.rows[0] || null;
}

export async function createConsumption(data, client) {
  const result = await client.query(
    `INSERT INTO feed_consumption (
       flock_id,
       feed_type_id,
       inventory_id,
       consumption_date,
       quantity_kg,
       cost_per_kg,
       notes,
       recorded_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.flock_id,
      data.feed_type_id,
      data.inventory_id,
      data.consumption_date,
      data.quantity_kg,
      data.cost_per_kg,
      data.notes,
      data.recorded_by
    ]
  );

  return result.rows[0];
}

export async function deductInventory(inventoryId, quantityKg, client) {
  const result = await client.query(
    `UPDATE finished_feed_inventory
     SET quantity_remaining_kg = quantity_remaining_kg - $2,
         updated_at = NOW()
     WHERE id = $1
       AND quantity_remaining_kg >= $2
     RETURNING *`,
    [inventoryId, quantityKg]
  );

  return result.rows[0] || null;
}

export async function findAllConsumption() {
  const result = await pool.query(
    `SELECT
       fc.*,
       f.name AS flock_name,
       fi.cost_per_kg AS current_inventory_cost_per_kg
     FROM feed_consumption fc
     JOIN flocks f ON f.id = fc.flock_id
     JOIN finished_feed_inventory fi ON fi.id = fc.inventory_id
     ORDER BY fc.consumption_date DESC, fc.created_at DESC`
  );

  return result.rows;
}

export async function findConsumptionById(id) {
  const result = await pool.query(
    `SELECT
       fc.*,
       f.name AS flock_name,
       fi.formula_id
     FROM feed_consumption fc
     JOIN flocks f ON f.id = fc.flock_id
     JOIN finished_feed_inventory fi ON fi.id = fc.inventory_id
     WHERE fc.id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

export async function findConsumptionByFlock(flockId) {
  const result = await pool.query(
    `SELECT *
     FROM feed_consumption
     WHERE flock_id = $1
     ORDER BY consumption_date DESC, created_at DESC`,
    [flockId]
  );

  return result.rows;
}

export async function getConsumptionSummary(startDate, endDate) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::integer AS records_count,
       COALESCE(SUM(quantity_kg), 0)::numeric
         AS total_quantity_consumed_kg,
       COALESCE(
         SUM(quantity_kg * cost_per_kg),
         0
       )::numeric AS total_feed_cost,
       COUNT(DISTINCT flock_id)::integer AS flocks_count
     FROM feed_consumption
     WHERE consumption_date >= $1::date
       AND consumption_date < ($2::date + INTERVAL '1 day')`,
    [startDate, endDate]
  );

  return result.rows[0];
}
