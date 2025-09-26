import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';

const DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  status?: 'active' | 'completed' | 'on_hold';
  icon?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export async function listProjects() {
  const result = await pool.query(
    `SELECT *
     FROM projects
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [DEFAULT_USER_ID]
  );
  return result.rows;
}

export async function createProject(input: CreateProjectInput) {
  const result = await pool.query(
    `INSERT INTO projects (user_id, name, description, color, status, icon)
     VALUES ($1, $2, $3, COALESCE($4, '#6366f1'), COALESCE($5, 'active'), COALESCE($6, '📁'))
     RETURNING *`,
    [
      DEFAULT_USER_ID,
      input.name,
      input.description ?? null,
      input.color,
      input.status,
      input.icon
    ]
  );

  return result.rows[0];
}

export async function updateProject(id: string, updates: UpdateProjectInput) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return existing.rows[0] ?? null;
  }

  const setFragments: string[] = [];
  const values: unknown[] = [id];

  entries.forEach(([key, value], index) => {
    setFragments.push(`${key} = $${index + 2}`);
    values.push(value);
  });

  const result = await pool.query(
    `UPDATE projects
     SET ${setFragments.join(', ')}, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteProject(id: string) {
  const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] ?? null;
}
