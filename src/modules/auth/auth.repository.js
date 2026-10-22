
import pool from '../../config/db.js';

// Create a user
export async function createUser({
  fullName,
  email,
  passwordHash
}) {
  const result = await pool.query(
    `INSERT INTO users (
      full_name,
      email,
      password_hash
    )
    VALUES ($1, $2, $3)
    RETURNING id, full_name, email, role`,
    [fullName, email, passwordHash]
  );

  return result.rows[0];
}

// Find a user by email for login
export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT
      id,
      full_name,
      email,
      password_hash,
      role,
      is_active
    FROM users
    WHERE LOWER(email) = $1
    LIMIT 1`,
    [email]
  );

  return result.rows[0] ?? null;
}

// Find an active user by ID
export async function findActiveUserById(userId) {
  const result = await pool.query(
    `SELECT
      id,
      full_name,
      email,
      role
    FROM users
    WHERE id = $1
      AND is_active = TRUE
    LIMIT 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}