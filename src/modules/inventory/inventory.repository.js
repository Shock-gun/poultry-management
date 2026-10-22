import pool from '../../config/db.js';

// Get raw-material stock based on purchases and actual production usage.
export async function findRawMaterialInventory() {
  const result = await pool.query(`
    SELECT
      rm.id AS raw_material_id,
      rm.name AS raw_material_name,
      rm.base_unit,
      COALESCE(p.total_purchased, 0) AS total_purchased,
      COALESCE(u.total_used, 0) AS total_used,

      (
        COALESCE(p.total_purchased, 0)
        - COALESCE(u.total_used, 0)
      ) AS estimated_remaining_stock,

      COALESCE(p.total_purchase_cost, 0) AS total_purchase_cost,

      CASE
        WHEN COALESCE(p.total_purchased, 0) > 0
        THEN ROUND(
          (
            p.total_purchase_cost / p.total_purchased
          )::numeric,
          2
        )
        ELSE 0
      END AS average_purchase_cost_per_unit,

      ROUND(
        (
          (
            COALESCE(p.total_purchased, 0)
            - COALESCE(u.total_used, 0)
          )
          *
          CASE
            WHEN COALESCE(p.total_purchased, 0) > 0
            THEN p.total_purchase_cost / p.total_purchased
            ELSE 0
          END
        )::numeric,
        2
      ) AS estimated_remaining_stock_value

    FROM raw_materials rm

    LEFT JOIN (
      SELECT
        raw_material_id,
        SUM(quantity) AS total_purchased,
        SUM(total_cost) AS total_purchase_cost
      FROM raw_material_purchases
      GROUP BY raw_material_id
    ) p ON p.raw_material_id = rm.id

    LEFT JOIN (
      SELECT
        raw_material_id,
        SUM(quantity_used_kg) AS total_used
      FROM feed_production_ingredients
      GROUP BY raw_material_id
    ) u ON u.raw_material_id = rm.id

    WHERE rm.is_active = TRUE
    ORDER BY rm.name ASC
  `);

  return result.rows;
}

// Get finished feed stock, including the formula and production batch.
export async function findFinishedFeedInventory() {
  const result = await pool.query(`
    SELECT
      ffi.id AS inventory_id,
      ffi.production_batch_id,
      ffi.formula_id,
      ff.name AS formula_name,
      ff.bird_type,
      fpb.batch_number,
      fpb.production_date,
      ffi.quantity_produced_kg,
      ffi.quantity_remaining_kg,
      ffi.cost_per_kg,

      ROUND(
        (
          ffi.quantity_remaining_kg * ffi.cost_per_kg
        )::numeric,
        2
      ) AS remaining_stock_value

    FROM finished_feed_inventory ffi

    LEFT JOIN feed_production_batches fpb
      ON fpb.id = ffi.production_batch_id

    LEFT JOIN feed_formulas ff
      ON ff.id = ffi.formula_id

    ORDER BY
      fpb.production_date DESC NULLS LAST,
      ffi.created_at DESC
  `);

  return result.rows;
}

// Summarize finished feed stock.
export async function getFinishedFeedSummary() {
  const result = await pool.query(`
    SELECT
      COUNT(*)::integer AS inventory_records,

      COALESCE(
        SUM(quantity_produced_kg), 0
      ) AS total_produced_kg,

      COALESCE(
        SUM(quantity_remaining_kg), 0
      ) AS total_remaining_kg,

      ROUND(
        COALESCE(
          SUM(quantity_remaining_kg * cost_per_kg), 0
        )::numeric,
        2
      ) AS remaining_stock_value

    FROM finished_feed_inventory
  `);

  return result.rows[0];
}

// Summarize raw-material inventory without adding together
// quantities that might use different measurement units.
export async function getRawMaterialInventorySummary() {
  const result = await pool.query(`
    SELECT
      COUNT(*)::integer AS raw_material_types,

      COUNT(*) FILTER (
        WHERE estimated_remaining_stock < 0
      )::integer AS materials_with_negative_stock,

      ROUND(
        COALESCE(SUM(total_purchase_cost), 0)::numeric,
        2
      ) AS total_purchase_cost,

      ROUND(
        COALESCE(SUM(estimated_remaining_stock_value), 0)::numeric,
        2
      ) AS estimated_remaining_stock_value

    FROM (
      SELECT
        rm.id,

        COALESCE(p.total_purchased, 0)
          - COALESCE(u.total_used, 0)
          AS estimated_remaining_stock,

        COALESCE(p.total_purchase_cost, 0)
          AS total_purchase_cost,

        CASE
          WHEN COALESCE(p.total_purchased, 0) > 0
          THEN (
            COALESCE(p.total_purchased, 0)
            - COALESCE(u.total_used, 0)
          ) * (
            p.total_purchase_cost / p.total_purchased
          )
          ELSE 0
        END AS estimated_remaining_stock_value

      FROM raw_materials rm

      LEFT JOIN (
        SELECT
          raw_material_id,
          SUM(quantity) AS total_purchased,
          SUM(total_cost) AS total_purchase_cost
        FROM raw_material_purchases
        GROUP BY raw_material_id
      ) p ON p.raw_material_id = rm.id

      LEFT JOIN (
        SELECT
          raw_material_id,
          SUM(quantity_used_kg) AS total_used
        FROM feed_production_ingredients
        GROUP BY raw_material_id
      ) u ON u.raw_material_id = rm.id

      WHERE rm.is_active = TRUE
    ) inventory
  `);

  return result.rows[0];
}