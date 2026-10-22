
import pool from '../../config/db.js';

export async function createFormula(data, client = pool) {
  const result = await client.query(
    `INSERT INTO feed_formulas
       (name, bird_type, batch_size_kg, description, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.name,
      data.bird_type,
      data.batch_size_kg,
      data.description,
      data.created_by
    ]
  );

  return result.rows[0];
}

export async function addFormulaIngredients(
  formulaId,
  ingredients,
  client = pool
) {
  const saved = [];

  for (const ingredient of ingredients) {
    const result = await client.query(
      `INSERT INTO feed_formula_ingredients
         (formula_id, raw_material_id, quantity_kg)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        formulaId,
        ingredient.raw_material_id,
        ingredient.quantity_kg
      ]
    );

    saved.push(result.rows[0]);
  }

  return saved;
}

export async function findAllFormulas() {
  const result = await pool.query(
    `SELECT
       f.*,
       COALESCE(
         json_agg(
           json_build_object(
             'raw_material_id', i.raw_material_id,
             'raw_material_name', m.name,
             'quantity_kg', i.quantity_kg
           )
         ) FILTER (WHERE i.id IS NOT NULL),
         '[]'::json
       ) AS ingredients
     FROM feed_formulas f
     LEFT JOIN feed_formula_ingredients i
       ON i.formula_id = f.id
     LEFT JOIN raw_materials m
       ON m.id = i.raw_material_id
     GROUP BY f.id
     ORDER BY f.created_at DESC`
  );

  return result.rows;
}

export async function findFormulaById(id) {
  const result = await pool.query(
    `SELECT
       f.*,
       COALESCE(
         json_agg(
           json_build_object(
             'raw_material_id', i.raw_material_id,
             'raw_material_name', m.name,
             'quantity_kg', i.quantity_kg
           )
         ) FILTER (WHERE i.id IS NOT NULL),
         '[]'::json
       ) AS ingredients
     FROM feed_formulas f
     LEFT JOIN feed_formula_ingredients i
       ON i.formula_id = f.id
     LEFT JOIN raw_materials m
       ON m.id = i.raw_material_id
     WHERE f.id = $1
     GROUP BY f.id`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function findRawMaterialsByIds(ids) {
  const result = await pool.query(
    `SELECT id, name, base_unit, is_active
     FROM raw_materials
     WHERE id = ANY($1::uuid[])`,
    [ids]
  );

  return result.rows;
}
