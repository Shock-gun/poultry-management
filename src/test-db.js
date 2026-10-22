
import pool from './config/db.js';

try {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_schema() AS schema_name,
      (SELECT COUNT(*) FROM public.users) AS user_count,
      (SELECT COUNT(*) FROM public.flocks) AS flock_count
  `);

  console.log('API database diagnostic:');
  console.table(result.rows[0]);
} catch (error) {
  console.error('Database diagnostic failed:', error.message);
} finally {
  await pool.end();
}
