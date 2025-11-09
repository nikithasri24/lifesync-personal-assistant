import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';

const DEV_DEFAULT_USER_ID = env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description?: string;
  payee?: string;
  date: string;
  tags?: string[];
  notes?: string;
}

export async function listAccounts(userId?: string | null) {
  const result = await pool.query(
    `SELECT *
     FROM financial_accounts
     WHERE is_active = true AND user_id = $1
     ORDER BY created_at DESC`,
    [userId ?? DEV_DEFAULT_USER_ID]
  );
  return result.rows;
}

export async function listTransactions(userId: string | null | undefined, limit = 100) {
  const result = await pool.query(
    `SELECT t.*, a.name AS account_name, c.name AS category_name, c.color AS category_color
     FROM financial_transactions t
     LEFT JOIN financial_accounts a ON t.account_id = a.id
     LEFT JOIN financial_categories c ON t.category_id = c.id
     WHERE t.user_id = $1
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT $2`,
    [userId ?? DEV_DEFAULT_USER_ID, limit]
  );
  return result.rows;
}

export async function createTransaction(userId: string | null | undefined, input: CreateTransactionInput) {
  const result = await pool.query(
    `INSERT INTO financial_transactions (
       user_id,
       account_id,
       category_id,
       type,
       amount,
       description,
       payee,
       date,
       tags,
       notes
     ) VALUES (
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8,
       COALESCE($9, ARRAY[]::text[]),
       $10
     )
     RETURNING *`,
    [
      userId ?? DEV_DEFAULT_USER_ID,
      input.account_id,
      input.category_id ?? null,
      input.type,
      input.amount,
      input.description ?? null,
      input.payee ?? null,
      input.date,
      input.tags ?? [],
      input.notes ?? null
    ]
  );

  return result.rows[0];
}
