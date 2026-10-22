import pool from '../../config/db.js';

// Build a farm-wide summary for a selected date range.
// Each table is aggregated separately to avoid multiplying totals
// when tables contain multiple records for the same date.
export async function getFarmSummary({ start_date, end_date }) {
  const result = await pool.query(
    `
    WITH production AS (
      SELECT
        COALESCE(SUM(eggs_collected), 0) AS eggs_collected,
        COALESCE(SUM(broken_eggs), 0) AS broken_eggs,
        COUNT(*)::integer AS production_records
      FROM egg_production
      WHERE ($1::date IS NULL OR production_date >= $1::date)
        AND ($2::date IS NULL OR production_date <= $2::date)
    ),
    sales AS (
      SELECT
        COALESCE(SUM(quantity_eggs), 0) AS eggs_sold,
        COALESCE(SUM(total_amount), 0) AS egg_sales_revenue,
        COUNT(*)::integer AS sales_records
      FROM egg_sales
      WHERE ($1::date IS NULL OR sale_date >= $1::date)
        AND ($2::date IS NULL OR sale_date <= $2::date)
    ),
    feed_production AS (
      SELECT
        COALESCE(SUM(actual_quantity_kg), 0) AS feed_produced_kg,
        COALESCE(SUM(total_material_cost), 0) AS feed_material_cost,
        COUNT(*)::integer AS production_batches
      FROM feed_production_batches
      WHERE ($1::date IS NULL OR production_date >= $1::date)
        AND ($2::date IS NULL OR production_date <= $2::date)
    ),
    feed_usage AS (
      SELECT
        COALESCE(SUM(quantity_kg), 0) AS feed_consumed_kg,
        COALESCE(
          SUM(quantity_kg * COALESCE(cost_per_kg, 0)), 0
        ) AS feed_consumption_cost
      FROM feed_consumption
      WHERE ($1::date IS NULL OR consumption_date >= $1::date)
        AND ($2::date IS NULL OR consumption_date <= $2::date)
    ),
    expenses AS (
      SELECT
        COALESCE(SUM(amount), 0) AS farm_expenses_total,
        COUNT(*)::integer AS expense_records
      FROM farm_expenses
      WHERE ($1::date IS NULL OR expense_date >= $1::date)
        AND ($2::date IS NULL OR expense_date <= $2::date)
    )
    SELECT
      production.eggs_collected,
      production.broken_eggs,
      GREATEST(
        production.eggs_collected - production.broken_eggs, 0
      ) AS intact_eggs,
      production.production_records,
      sales.eggs_sold,
      sales.egg_sales_revenue,
      sales.sales_records,
      CASE
        WHEN sales.eggs_sold > 0
        THEN ROUND(
          (sales.egg_sales_revenue / sales.eggs_sold)::numeric, 2
        )
        ELSE 0
      END AS average_selling_price_per_egg,
      feed_production.feed_produced_kg,
      feed_production.feed_material_cost,
      feed_production.production_batches,
      feed_usage.feed_consumed_kg,
      feed_usage.feed_consumption_cost,
      CASE
        WHEN feed_usage.feed_consumed_kg > 0
        THEN ROUND(
          (
            feed_usage.feed_consumption_cost
            / feed_usage.feed_consumed_kg
          )::numeric, 2
        )
        ELSE 0
      END AS average_feed_consumption_cost_per_kg,
      expenses.farm_expenses_total,
      expenses.expense_records,
      (
        sales.egg_sales_revenue
        - feed_usage.feed_consumption_cost
        - expenses.farm_expenses_total
      ) AS estimated_operating_profit,
      CASE
        WHEN production.eggs_collected > production.broken_eggs
        THEN ROUND(
          (
            (
              feed_usage.feed_consumption_cost
              + expenses.farm_expenses_total
            ) / (
              production.eggs_collected - production.broken_eggs
            )
          )::numeric, 2
        )
        ELSE 0
      END AS estimated_operating_cost_per_intact_egg,
      CASE
        WHEN sales.egg_sales_revenue > 0
        THEN ROUND(
          (
            (
              sales.egg_sales_revenue
              - feed_usage.feed_consumption_cost
              - expenses.farm_expenses_total
            ) / sales.egg_sales_revenue * 100
          )::numeric, 2
        )
        ELSE 0
      END AS estimated_profit_margin_percent
    FROM production
    CROSS JOIN sales
    CROSS JOIN feed_production
    CROSS JOIN feed_usage
    CROSS JOIN expenses
    `,
    [start_date || null, end_date || null]
  );

  return result.rows[0];
}
// Return daily totals for production, sales, feed consumption,
// feed production costs, and farm expenses.
export async function getDailyFarmReport({ start_date, end_date }) {
  const result = await pool.query(
    `SELECT
       report_date,
       category,
       quantity,
       amount
     FROM (
       SELECT
         production_date AS report_date,
         'egg_production'::text AS category,
         SUM(eggs_collected)::numeric AS quantity,
         SUM(broken_eggs)::numeric AS amount
       FROM egg_production
       WHERE ($1::date IS NULL OR production_date >= $1::date)
         AND ($2::date IS NULL OR production_date <= $2::date)
       GROUP BY production_date

       UNION ALL

       SELECT
         sale_date AS report_date,
         'egg_sales'::text AS category,
         SUM(quantity_eggs)::numeric AS quantity,
         SUM(total_amount)::numeric AS amount
       FROM egg_sales
       WHERE ($1::date IS NULL OR sale_date >= $1::date)
         AND ($2::date IS NULL OR sale_date <= $2::date)
       GROUP BY sale_date

       UNION ALL

       SELECT
         consumption_date AS report_date,
         'feed_consumption'::text AS category,
         SUM(quantity_kg)::numeric AS quantity,
         SUM(quantity_kg * COALESCE(cost_per_kg, 0))::numeric AS amount
       FROM feed_consumption
       WHERE ($1::date IS NULL OR consumption_date >= $1::date)
         AND ($2::date IS NULL OR consumption_date <= $2::date)
       GROUP BY consumption_date

       UNION ALL

       SELECT
         production_date AS report_date,
         'feed_production'::text AS category,
         SUM(actual_quantity_kg)::numeric AS quantity,
         SUM(total_material_cost)::numeric AS amount
       FROM feed_production_batches
       WHERE ($1::date IS NULL OR production_date >= $1::date)
         AND ($2::date IS NULL OR production_date <= $2::date)
       GROUP BY production_date

       UNION ALL

       SELECT
         expense_date AS report_date,
         'farm_expenses'::text AS category,
         COUNT(*)::numeric AS quantity,
         SUM(amount)::numeric AS amount
       FROM farm_expenses
       WHERE ($1::date IS NULL OR expense_date >= $1::date)
         AND ($2::date IS NULL OR expense_date <= $2::date)
       GROUP BY expense_date
     ) daily
     ORDER BY report_date DESC, category ASC`,
    [start_date || null, end_date || null]
  );

  return result.rows;
}