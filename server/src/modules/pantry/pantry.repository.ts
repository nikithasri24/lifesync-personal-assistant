import { pool } from '../../db/pool.js'
import { env } from '../../config/env.js'

const DEV_DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000'

export async function listPantryItems(userId?: string | null) {
  const result = await pool.query(
    `SELECT * FROM pantry_items WHERE ($1::uuid IS NULL OR user_id = $1) ORDER BY created_at DESC`,
    [userId ?? DEV_DEFAULT_USER_ID]
  )
  return result.rows
}

export async function createPantryItem(userId: string | null | undefined, input: any) {
  const result = await pool.query(
    `INSERT INTO pantry_items (
       user_id, name, quantity, unit, category, subcategory, location, expiration_date, notes, is_low_stock, low_stock_threshold
     ) VALUES (
       $1, $2, COALESCE($3, 1), $4, $5, $6, $7, $8, $9, COALESCE($10, false), $11
     ) RETURNING *`,
    [
      userId ?? DEV_DEFAULT_USER_ID,
      input.name,
      input.quantity ?? null,
      input.unit ?? null,
      input.category ?? null,
      input.subcategory ?? null,
      input.location ?? null,
      input.expiration_date ?? null,
      input.notes ?? null,
      input.is_low_stock ?? null,
      input.low_stock_threshold ?? null,
    ]
  )
  return result.rows[0]
}

export async function updatePantryItem(id: string, updates: Record<string, unknown>) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM pantry_items WHERE id = $1', [id])
    return existing.rows[0] ?? null
  }
  const setFragments: string[] = []
  const values: unknown[] = [id]
  entries.forEach(([k, v], i) => { setFragments.push(`${k} = $${i + 2}`); values.push(v) })
  const result = await pool.query(
    `UPDATE pantry_items SET ${setFragments.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] ?? null
}

export async function deletePantryItem(id: string) {
  const result = await pool.query('DELETE FROM pantry_items WHERE id = $1 RETURNING *', [id])
  return result.rows[0] ?? null
}
