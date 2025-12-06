import { pool } from '../../db/pool.js'
import { env } from '../../config/env.js'

const DEV_DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000'

export async function listRecipes(userId?: string | null) {
  const result = await pool.query(
    `SELECT * FROM recipes WHERE ($1::uuid IS NULL OR user_id = $1) ORDER BY created_at DESC`,
    [userId ?? DEV_DEFAULT_USER_ID]
  )
  return result.rows
}

export async function createRecipe(userId: string | null | undefined, input: any) {
  const result = await pool.query(
    `INSERT INTO recipes (user_id, name, description, prep_time, cook_time, instructions, tags, source_url)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, ARRAY[]::text[]), $8) RETURNING *`,
    [
      userId ?? DEV_DEFAULT_USER_ID,
      input.name,
      input.description ?? null,
      input.prep_time ?? null,
      input.cook_time ?? null,
      input.instructions ?? null,
      input.tags ?? [],
      input.source_url ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateRecipe(id: string, updates: Record<string, unknown>) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM recipes WHERE id = $1', [id])
    return existing.rows[0] ?? null
  }
  const setFragments: string[] = []
  const values: unknown[] = [id]
  entries.forEach(([k, v], i) => { setFragments.push(`${k} = $${i + 2}`); values.push(v) })
  const result = await pool.query(
    `UPDATE recipes SET ${setFragments.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] ?? null
}

export async function deleteRecipe(id: string) {
  const result = await pool.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [id])
  return result.rows[0] ?? null
}
