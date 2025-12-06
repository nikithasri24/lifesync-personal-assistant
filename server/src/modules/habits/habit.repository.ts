import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';

const DEV_DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export interface CreateHabitInput {
  name: string;
  description?: string;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  target_value?: number;
  unit?: string;
  color?: string;
  icon?: string;
}

export interface HabitEntryInput {
  habit_id: string;
  date?: string;
  value?: number;
  notes?: string;
  mood?: string;
}

export async function listHabits(userId?: string | null) {
  const result = await pool.query(
    `SELECT h.*, COUNT(he.id) AS total_entries, MAX(he.date) AS last_entry_date
     FROM habits h
     LEFT JOIN habit_entries he ON h.id = he.habit_id
     WHERE h.is_active = true AND ($1::uuid IS NULL OR h.user_id = $1)
     GROUP BY h.id
     ORDER BY h.created_at DESC`,
    [userId ?? DEV_DEFAULT_USER_ID]
  );

  return result.rows;
}

export async function createHabit(userId: string | null | undefined, input: CreateHabitInput) {
  const result = await pool.query(
    `INSERT INTO habits (
       user_id,
       name,
       description,
       category,
       frequency,
       target_value,
       unit,
       color,
       icon
     ) VALUES (
       $1,
       $2,
       $3,
       COALESCE($4, 'general'),
       COALESCE($5, 'daily'),
       COALESCE($6, 1),
       $7,
       COALESCE($8, '#10b981'),
       COALESCE($9, '✅')
     )
     RETURNING *`,
    [
      userId ?? DEV_DEFAULT_USER_ID,
      input.name,
      input.description ?? null,
      input.category,
      input.frequency,
      input.target_value,
      input.unit ?? null,
      input.color,
      input.icon
    ]
  );

  return result.rows[0];
}

export async function upsertHabitEntry(input: HabitEntryInput) {
  const result = await pool.query(
    `INSERT INTO habit_entries (habit_id, date, value, notes, mood)
     VALUES ($1, COALESCE($2::date, CURRENT_DATE), COALESCE($3, 1), $4, $5)
     ON CONFLICT (habit_id, date)
     DO UPDATE SET value = excluded.value, notes = excluded.notes, mood = excluded.mood
     RETURNING *`,
    [input.habit_id, input.date ?? null, input.value ?? null, input.notes ?? null, input.mood ?? null]
  );

  return result.rows[0];
}

export async function updateHabit(id: string, updates: Partial<CreateHabitInput>) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM habits WHERE id = $1', [id])
    return existing.rows[0] ?? null
  }

  const setFragments: string[] = []
  const values: unknown[] = [id]
  entries.forEach(([key, value], index) => {
    setFragments.push(`${key} = $${index + 2}`)
    values.push(value)
  })

  const result = await pool.query(
    `UPDATE habits
     SET ${setFragments.join(', ')}, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    values
  )
  return result.rows[0] ?? null
}

export async function deleteHabit(id: string) {
  const result = await pool.query('DELETE FROM habits WHERE id = $1 RETURNING *', [id])
  return result.rows[0] ?? null
}
