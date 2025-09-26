import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';

const DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export interface CreateTaskInput {
  title: string;
  description?: string;
  project_id?: string;
  status?: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_time?: number;
  actual_time?: number;
  due_date?: string;
  tags?: string[];
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  notes?: string;
  starred?: boolean;
  archived?: boolean;
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  deleted?: boolean;
  deleted_at?: string | null;
};

export async function listTasks() {
  const result = await pool.query(
    `SELECT t.*, p.name as project_name, p.color as project_color, p.icon as project_icon
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     WHERE t.deleted = false AND t.user_id = $1
     ORDER BY t.created_at DESC`,
    [DEFAULT_USER_ID]
  );
  return result.rows;
}

export async function createTask(input: CreateTaskInput) {
  const result = await pool.query(
    `INSERT INTO tasks (
       user_id,
       title,
       description,
       project_id,
       status,
       priority,
       estimated_time,
       actual_time,
       due_date,
       tags,
       category,
       notes,
       starred,
       archived
     ) VALUES (
       $1, $2, $3, $4, COALESCE($5, 'todo'), COALESCE($6, 'medium'),
       COALESCE($7, 25), COALESCE($8, 0), $9, COALESCE($10, ARRAY[]::text[]),
       COALESCE($11, 'other'), $12, COALESCE($13, false), COALESCE($14, false)
     )
     RETURNING *`,
    [
      DEFAULT_USER_ID,
      input.title,
      input.description ?? null,
      input.project_id ?? null,
      input.status,
      input.priority,
      input.estimated_time,
      input.actual_time,
      input.due_date ?? null,
      input.tags ?? [],
      input.category,
      input.notes ?? null,
      input.starred,
      input.archived
    ]
  );

  return result.rows[0];
}

export async function updateTask(id: string, updates: UpdateTaskInput) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return existing.rows[0] ?? null;
  }

  const setFragments: string[] = [];
  const values: unknown[] = [id];

  entries.forEach(([key, value], index) => {
    setFragments.push(`${key} = $${index + 2}`);
    values.push(value);
  });

  const result = await pool.query(
    `UPDATE tasks
     SET ${setFragments.join(', ')}, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    values
  );

  return result.rows[0] ?? null;
}

export async function softDeleteTask(id: string) {
  const result = await pool.query(
    `UPDATE tasks
     SET deleted = true, deleted_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function restoreTask(id: string) {
  const result = await pool.query(
    `UPDATE tasks
     SET deleted = false, deleted_at = NULL
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function permanentlyDeleteTask(id: string) {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] ?? null;
}
