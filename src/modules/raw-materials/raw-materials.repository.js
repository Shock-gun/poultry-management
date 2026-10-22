
import pool from '../../config/db.js';

// Create a raw material.
export async function createRawMaterial(data) {
  const result = await pool.query(
    `INSERT INTO raw_materials
       (name, base_unit, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.name, data.base_unit, data.description]
  );

  return result.rows[0];
}

// Get all raw materials.
export async function findAllRawMaterials() {
  const result = await pool.query(
    `SELECT *
     FROM raw_materials
     ORDER BY name ASC`
  );

  return result.rows;
}

// Find one raw material by ID.
export async function findRawMaterialById(id) {
  const result = await pool.query(
    `SELECT *
     FROM raw_materials
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

// Record a raw-material purchase.
export async function createRawMaterialPurchase(data) {
  const result = await pool.query(
    `INSERT INTO raw_material_purchases
       (
         raw_material_id,
         purchase_date,
         supplier_name,
         quantity,
         unit_cost,
         total_cost,
         notes,
         recorded_by
       )
     VALUES (
       $1,
       COALESCE($2::date, CURRENT_DATE),
       $3, $4, $5, $6, $7, $8
     )
     RETURNING *`,
    [
      data.raw_material_id,
      data.purchase_date,
      data.supplier_name,
      data.quantity,
      data.unit_cost,
      data.total_cost ?? data.quantity * data.unit_cost,
      data.notes,
      data.recorded_by
    ]
  );

  return result.rows[0];
}

// List purchases, optionally for one material.
export async function findRawMaterialPurchases(rawMaterialId = null) {
  const result = await pool.query(
    `SELECT
       p.*,
       m.name AS raw_material_name,
       m.base_unit
     FROM raw_material_purchases p
     JOIN raw_materials m
       ON m.id = p.raw_material_id
     WHERE ($1::uuid IS NULL OR p.raw_material_id = $1::uuid)
     ORDER BY p.purchase_date DESC, p.created_at DESC`,
    [rawMaterialId]
  );

  return result.rows;
}

// Summarize purchases, consumption, remaining quantity and average cost.

export async function getRawMaterialPurchaseSummary(rawMaterialId) {
  const result = await pool.query(
    `SELECT
       m.id AS raw_material_id,
       m.name,
       m.base_unit,

       COALESCE(p.total_quantity_purchased, 0)::numeric
         AS total_quantity_purchased,

       COALESCE(p.total_purchase_cost, 0)::numeric
         AS total_purchase_cost,

       COALESCE(c.total_quantity_used, 0)::numeric
         AS total_quantity_used,

       (
         COALESCE(p.total_quantity_purchased, 0)
         - COALESCE(c.total_quantity_used, 0)
       )::numeric AS quantity_remaining,

       CASE
         WHEN COALESCE(p.total_quantity_purchased, 0) > 0
         THEN ROUND(
           p.total_purchase_cost / p.total_quantity_purchased,
           4
         )
         ELSE 0
       END AS average_unit_cost,

       ROUND(
         (
           COALESCE(p.total_quantity_purchased, 0)
           - COALESCE(c.total_quantity_used, 0)
         ) *
         CASE
           WHEN COALESCE(p.total_quantity_purchased, 0) > 0
           THEN p.total_purchase_cost / p.total_quantity_purchased
           ELSE 0
         END,
         2
       ) AS remaining_stock_value

     FROM raw_materials m

     LEFT JOIN LATERAL (
       SELECT
         SUM(quantity) AS total_quantity_purchased,
         SUM(COALESCE(total_cost, quantity * unit_cost))
           AS total_purchase_cost
       FROM raw_material_purchases
       WHERE raw_material_id = m.id
     ) p ON TRUE

     LEFT JOIN LATERAL (
       SELECT
         SUM(quantity_used_kg) AS total_quantity_used
       FROM feed_production_ingredients
       WHERE raw_material_id = m.id
     ) c ON TRUE

     WHERE m.id = $1`,
    [rawMaterialId]
  );

  return result.rows[0] ?? null;
}
