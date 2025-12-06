import { pool } from '../../db/pool.js'
import { env } from '../../config/env.js'

const DEV_DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000'

export async function listShoppingLists(userId?: string | null) {
  const result = await pool.query(
    `SELECT * FROM shopping_lists
     WHERE ($1::uuid IS NULL OR user_id = $1)
     ORDER BY created_at DESC`,
    [userId ?? DEV_DEFAULT_USER_ID]
  )
  return result.rows
}

export async function createShoppingList(userId: string | null | undefined, input: {
  name: string
  description?: string
  status?: 'active' | 'completed' | 'archived'
  store?: string
  shopping_date?: string
}) {
  const result = await pool.query(
    `INSERT INTO shopping_lists (user_id, name, description, status, store, shopping_date)
     VALUES ($1, $2, $3, COALESCE($4, 'active'), $5, $6)
     RETURNING *`,
    [
      userId ?? DEV_DEFAULT_USER_ID,
      input.name,
      input.description ?? null,
      input.status,
      input.store ?? null,
      input.shopping_date ?? null,
    ]
  )
  return result.rows[0]
}

export async function listShoppingItems(listId: string) {
  const result = await pool.query(
    `SELECT * FROM shopping_items WHERE shopping_list_id = $1 ORDER BY position NULLS LAST, created_at DESC`,
    [listId]
  )
  return result.rows
}

export async function addShoppingItem(listId: string, input: any) {
  const result = await pool.query(
    `INSERT INTO shopping_items (
       shopping_list_id, name, quantity, unit, estimated_price, actual_price,
       is_purchased, priority, tags
     ) VALUES (
       $1, $2, COALESCE($3, 1), $4, $5, $6, COALESCE($7, false), COALESCE($8, 'medium'), COALESCE($9, ARRAY[]::text[])
     ) RETURNING *`,
    [
      listId,
      input.name,
      input.quantity ?? null,
      input.unit ?? null,
      input.estimated_price ?? null,
      input.actual_price ?? null,
      input.is_purchased ?? null,
      input.priority ?? null,
      input.tags ?? [],
    ]
  )
  return result.rows[0]
}

export async function updateShoppingItem(id: string, updates: Record<string, unknown>) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM shopping_items WHERE id = $1', [id])
    return existing.rows[0] ?? null
  }
  const setFragments: string[] = []
  const values: unknown[] = [id]
  entries.forEach(([k, v], i) => { setFragments.push(`${k} = $${i + 2}`); values.push(v) })
  const result = await pool.query(
    `UPDATE shopping_items SET ${setFragments.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] ?? null
}

export async function deleteShoppingItem(id: string) {
  const result = await pool.query('DELETE FROM shopping_items WHERE id = $1 RETURNING *', [id])
  return result.rows[0] ?? null
}
