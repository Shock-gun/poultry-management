
import pool from '../../config/db.js';

// Record daily egg production
export async function createProduction(data) {
  const result = await pool.query(
    `INSERT INTO egg_production (
      flock_id,
      production_date,
      eggs_collected,
      broken_eggs,
      recorded_by,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.flock_id,
      data.production_date,
      data.eggs_collected,
      data.broken_eggs,
      data.recorded_by,
      data.notes
    ]
  );

  return result.rows[0];
}

// Get all egg production records
export async function findAllProduction() {
  const result = await pool.query(
    `SELECT
      id,
      flock_id,
      production_date,
      eggs_collected,
      broken_eggs,
      recorded_by,
      notes,
      created_at,
      updated_at
    FROM egg_production
    ORDER BY production_date DESC, created_at DESC`
  );

  return result.rows;
}

// Get egg production records for one flock
export async function findProductionByFlock(flockId) {
  const result = await pool.query(
    `SELECT
      id,
      flock_id,
      production_date,
      eggs_collected,
      broken_eggs,
      recorded_by,
      notes,
      created_at,
      updated_at
    FROM egg_production
    WHERE flock_id = $1
    ORDER BY production_date DESC`
    ,
    [flockId]
  );

  return result.rows;
}

export async function getDailyProductionSummary(date) {
  const result = await pool.query(
    `SELECT
       production_date::text AS production_date,
       COUNT(*)::int AS records_count,
       COUNT(DISTINCT flock_id)::int AS flocks_count,
       COALESCE(SUM(eggs_collected), 0)::int AS eggs_collected,
       COALESCE(SUM(broken_eggs), 0)::int AS broken_eggs,
       COALESCE(
         SUM(eggs_collected - broken_eggs), 0
       )::int AS intact_eggs
     FROM egg_production
     WHERE production_date = $1::date
     GROUP BY production_date`,
    [date]
  );

  if (result.rows.length === 0) {
    return {
      production_date: date,
      records_count: 0,
      flocks_count: 0,
      eggs_collected: 0,
      broken_eggs: 0,
      intact_eggs: 0
    };
  }

  return result.rows[0];
}

export async function getProductionSummaryByDateRange(startDate, endDate) {
  const result = await pool.query(
    `SELECT
  production_date::text AS production_date,
  COUNT(*)::int AS records_count,
  COUNT(DISTINCT flock_id)::int AS flocks_count,
  ARRAY_AGG(DISTINCT flock_id::text) AS flock_ids,
  COALESCE(SUM(eggs_collected), 0)::int AS eggs_collected,
  COALESCE(SUM(broken_eggs), 0)::int AS broken_eggs,
  COALESCE(SUM(eggs_collected - broken_eggs), 0)::int AS intact_eggs
FROM egg_production
WHERE production_date BETWEEN $1::date AND $2::date
GROUP BY production_date
ORDER BY production_date ASC`,
    [startDate, endDate]
  );

  const dailyTotals = result.rows;

  const totals = dailyTotals.reduce(
    (summary, day) => ({
      records_count: summary.records_count + day.records_count,
      flocks_count: summary.flocks_count + day.flocks_count,
      eggs_collected: summary.eggs_collected + day.eggs_collected,
      broken_eggs: summary.broken_eggs + day.broken_eggs,
      intact_eggs: summary.intact_eggs + day.intact_eggs
    }),
    {
      records_count: 0,
      flocks_count: 0,
      eggs_collected: 0,
      broken_eggs: 0,
      intact_eggs: 0
    }
  );

  return {
    start_date: startDate,
    end_date: endDate,
    ...totals,
    daily_totals: dailyTotals
  };
}
