
import pool from '../../config/db.js';

// Create an expense record.
export async function createExpense(data) {
  const result = await pool.query(
    `INSERT INTO farm_expenses (
       flock_id,
       category,
       amount,
       expense_date,
       description,
       recorded_by
     )
     VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6)
     RETURNING *`,
    [
      data.flock_id || null,
      data.category,
      data.amount,
      data.expense_date || null,
      data.description || null,
      data.recorded_by || null
    ]
  );

  return result.rows[0];
}

// List expenses, with optional date and flock filters.
export async function findAllExpenses(filters = {}) {
  const result = await pool.query(
    `SELECT
       e.*,
       f.name AS flock_name
     FROM farm_expenses e
     LEFT JOIN flocks f ON f.id = e.flock_id
     WHERE ($1::date IS NULL OR e.expense_date >= $1::date)
       AND ($2::date IS NULL OR e.expense_date <= $2::date)
       AND ($3::uuid IS NULL OR e.flock_id = $3::uuid)
       AND ($4::varchar IS NULL OR e.category = $4::varchar)
     ORDER BY e.expense_date DESC, e.created_at DESC`,
    [
      filters.start_date || null,
      filters.end_date || null,
      filters.flock_id || null,
      filters.category || null
    ]
  );

  return result.rows;
}

// Find one expense by ID.
export async function findExpenseById(id) {
  const result = await pool.query(
    `SELECT
       e.*,
       f.name AS flock_name
     FROM farm_expenses e
     LEFT JOIN flocks f ON f.id = e.flock_id
     WHERE e.id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

// Update an existing expense.
export async function updateExpense(id, data) {
  const result = await pool.query(
    `UPDATE farm_expenses
     SET flock_id = $2,
         category = $3,
         amount = $4,
         expense_date = $5,
         description = $6,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.flock_id || null,
      data.category,
      data.amount,
      data.expense_date,
      data.description || null
    ]
  );

  return result.rows[0] || null;
}

// Delete an expense record.
export async function deleteExpense(id) {
  const result = await pool.query(
    `DELETE FROM farm_expenses
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0] || null;
}

// Summarize expenses for a date range.
export async function getExpenseSummary(startDate, endDate) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::integer AS records_count,
       COALESCE(SUM(amount), 0)::numeric AS total_expenses,
       COALESCE(
         SUM(amount) FILTER (WHERE flock_id IS NOT NULL),
         0
       )::numeric AS flock_specific_expenses,
       COALESCE(
         SUM(amount) FILTER (WHERE flock_id IS NULL),
         0
       )::numeric AS general_farm_expenses
     FROM farm_expenses
     WHERE expense_date >= $1::date
       AND expense_date <= $2::date`,
    [startDate, endDate]
  );

  return result.rows[0];
}
