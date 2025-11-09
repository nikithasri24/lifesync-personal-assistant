import { pool } from '../../db/pool.js'
import { env } from '../../config/env.js'

const DEV_DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000'

export async function listMealPlans(userId?: string | null) {
  const result = await pool.query(
    `SELECT * FROM meal_plans WHERE ($1::uuid IS NULL OR user_id = $1) ORDER BY week_start_date DESC, created_at DESC`,
    [userId ?? DEV_DEFAULT_USER_ID]
  )
  return result.rows
}

export async function findMealPlanByWeek(userId: string | null | undefined, weekStart: string) {
  const result = await pool.query(
    `SELECT * FROM meal_plans WHERE user_id = COALESCE($1, user_id) AND week_start_date = $2 LIMIT 1`,
    [userId ?? DEV_DEFAULT_USER_ID, weekStart]
  )
  return result.rows[0] ?? null
}

export async function listPlannedMealsInRange(userId: string | null | undefined, start: string, end: string) {
  const result = await pool.query(
    `SELECT pm.* FROM planned_meals pm
     JOIN meal_plans mp ON mp.id = pm.meal_plan_id
     WHERE mp.user_id = COALESCE($1, mp.user_id)
       AND pm.date >= $2 AND pm.date <= $3
     ORDER BY pm.date ASC, pm.meal_type ASC`,
    [userId ?? DEV_DEFAULT_USER_ID, start, end]
  )
  return result.rows
}

export async function createMealPlan(userId: string | null | undefined, input: any) {
  const result = await pool.query(
    `INSERT INTO meal_plans (user_id, name, week_start_date, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId ?? DEV_DEFAULT_USER_ID, input.name, input.week_start_date, input.notes ?? null]
  )
  return result.rows[0]
}

export async function updateMealPlan(id: string, updates: Record<string, unknown>) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM meal_plans WHERE id = $1', [id])
    return existing.rows[0] ?? null
  }
  const setFragments: string[] = []
  const values: unknown[] = [id]
  entries.forEach(([k, v], i) => { setFragments.push(`${k} = $${i + 2}`); values.push(v) })
  const result = await pool.query(
    `UPDATE meal_plans SET ${setFragments.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] ?? null
}

export async function deleteMealPlan(id: string) {
  const result = await pool.query('DELETE FROM meal_plans WHERE id = $1 RETURNING *', [id])
  return result.rows[0] ?? null
}

export async function createPlannedMeal(input: any) {
  const result = await pool.query(
    `INSERT INTO planned_meals (
       meal_plan_id, recipe_id, meal_type, date, servings, custom_meal, people_count, status, notes
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'planned'), $9
     ) RETURNING *`,
    [
      input.meal_plan_id,
      input.recipe_id ?? null,
      input.meal_type,
      input.date,
      input.servings ?? null,
      input.custom_meal ?? null,
      input.people_count ?? null,
      input.status ?? null,
      input.notes ?? null,
    ]
  )
  return result.rows[0]
}

export async function updatePlannedMeal(id: string, updates: Record<string, unknown>) {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined)
  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM planned_meals WHERE id = $1', [id])
    return existing.rows[0] ?? null
  }
  const setFragments: string[] = []
  const values: unknown[] = [id]
  entries.forEach(([k, v], i) => { setFragments.push(`${k} = $${i + 2}`); values.push(v) })
  const result = await pool.query(
    `UPDATE planned_meals SET ${setFragments.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    values
  )
  return result.rows[0] ?? null
}

export async function deletePlannedMeal(id: string) {
  const result = await pool.query('DELETE FROM planned_meals WHERE id = $1 RETURNING *', [id])
  return result.rows[0] ?? null
}
