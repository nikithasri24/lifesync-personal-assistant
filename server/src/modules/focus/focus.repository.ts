import { pool } from '../../db/pool.js'
import { env } from '../../config/env.js'

const DEV_DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000'

export async function listFocusSessions(userId?: string | null) {
  const result = await pool.query(
    `SELECT * FROM focus_sessions WHERE ($1::uuid IS NULL OR user_id = $1) ORDER BY start_time DESC, created_at DESC`,
    [userId ?? DEV_DEFAULT_USER_ID]
  )
  return result.rows
}

export async function createFocusSession(userId: string | null | undefined, input: any) {
  const result = await pool.query(
    `INSERT INTO focus_sessions (
       user_id, preset, duration, actual_duration, start_time, end_time, status, task_id, notes
     ) VALUES (
       $1, $2, $3, $4, $5, $6, COALESCE($7, 'active'), $8, $9
     ) RETURNING *`,
    [
      userId ?? DEV_DEFAULT_USER_ID,
      input.preset,
      input.duration,
      input.actual_duration ?? null,
      input.start_time,
      input.end_time ?? null,
      input.status ?? null,
      input.task_id ?? null,
      input.notes ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateFocusSession(id: string, updates: Record<string, unknown>) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM focus_sessions WHERE id = $1', [id])
    return existing.rows[0] ?? null
  }
  const setFragments: string[] = []
  const values: unknown[] = [id]
  entries.forEach(([k, v], i) => { setFragments.push(`${k} = $${i + 2}`); values.push(v) })
  const result = await pool.query(
    `UPDATE focus_sessions SET ${setFragments.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] ?? null
}
