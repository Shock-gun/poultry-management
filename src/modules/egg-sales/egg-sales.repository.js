
import pool from '../../config/db.js';

export async function createEggSale(data) {
  const result = await pool.query(
    `INSERT INTO egg_sales (
       flock_id, sale_date, buyer_name, quantity_eggs,
       price_per_egg, total_amount, notes, recorded_by
     )
     VALUES (
       $1, COALESCE($2::date, CURRENT_DATE),
       $3, $4, $5, $6, $7, $8
     )
     RETURNING *`,
    [
      data.flock_id || null,
      data.sale_date || null,
      data.buyer_name || null,
      data.quantity_eggs,
      data.price_per_egg,
      data.quantity_eggs * data.price_per_egg,
      data.notes || null,
      data.recorded_by || null,
    ]
  );

  return result.rows[0];
}

export async function findEggSales({ start_date, end_date }) {
  const result = await pool.query(
    `SELECT *
     FROM egg_sales
     WHERE ($1::date IS NULL OR sale_date >= $1::date)
       AND ($2::date IS NULL OR sale_date <= $2::date)
     ORDER BY sale_date DESC, created_at DESC`,
    [start_date || null, end_date || null]
  );

  return result.rows;
}

export async function findEggSaleById(id) {
  const result = await pool.query(
    'SELECT * FROM egg_sales WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

export async function getEggSalesSummary({ start_date, end_date }) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::integer AS sales_records,
       COALESCE(SUM(quantity_eggs), 0) AS eggs_sold,
       COALESCE(SUM(total_amount), 0) AS total_revenue,
       CASE
         WHEN COALESCE(SUM(quantity_eggs), 0) > 0
         THEN ROUND(
           (SUM(total_amount) / SUM(quantity_eggs))::numeric,
           2
         )
         ELSE 0
       END AS average_selling_price_per_egg
     FROM egg_sales
     WHERE ($1::date IS NULL OR sale_date >= $1::date)
       AND ($2::date IS NULL OR sale_date <= $2::date)`,
    [start_date || null, end_date || null]
  );

  return result.rows[0];
}
