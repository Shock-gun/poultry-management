
import pool from '../../config/db.js';

// Create a flock
export async function createFlock(data) {
  const result = await pool.query(
    `INSERT INTO flocks (
      name,
      breed,
      bird_type,
      initial_quantity,
      current_quantity,
      acquisition_date,
      created_by
    )
    VALUES ($1, $2, $3, $4, $4, $5, $6)
    RETURNING *`,
    [
      data.name,
      data.breed,
      data.bird_type,
      data.initial_quantity,
      data.acquisition_date,
      data.created_by
    ]
  );

  return result.rows[0];
}

// List flocks, newest first
export async function findAllFlocks() {
  const result = await pool.query(
    `SELECT
      id,
      name,
      breed,
      bird_type,
      initial_quantity,
      current_quantity,
      acquisition_date,
      status,
      created_by,
      created_at,
      updated_at
    FROM flocks
    ORDER BY created_at DESC`
  );

  return result.rows;
}

// Find one flock by ID

/**
 * Update editable details of an existing flock.
 * Initial quantity and current quantity are intentionally
 * excluded from this operation.
 */
export async function updateFlock(id, data) {
  const result = await pool.query(
    `UPDATE flocks
     SET
       name = $1,
       breed = $2,
       bird_type = $3,
       acquisition_date = $4,
       updated_at = NOW()
     WHERE id = $5
       AND status = 'active'
     RETURNING *`,
    [
      data.name,
      data.breed,
      data.bird_type,
      data.acquisition_date,
      id
    ]
  );

  return result.rows[0] ?? null;
}

 // Close an active flock
export async function closeFlock(id) {
  const result = await pool.query(
    `UPDATE flocks
     SET
       status = 'closed',
       updated_at = NOW()
     WHERE id = $1
       AND status = 'active'
     RETURNING *`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function findFlockById(id) {
  const result = await pool.query(
    `SELECT *
    FROM flocks
    WHERE id = $1
    LIMIT 1`,
    [id]
  );

  return result.rows[0] ?? null;
}
