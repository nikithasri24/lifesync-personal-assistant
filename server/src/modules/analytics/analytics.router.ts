import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { env } from '../../config/env.js'

export const analyticsRouter = Router()

analyticsRouter.get('/dashboard', async (req: any, res: any) => {
  const userId = req.userId ?? env.DEFAULT_USER_ID ?? null
  const client = pool
  const [taskTotal, taskCompleted, habitTotal, focusSummary, financeSummary] = await Promise.all([
    client.query(`SELECT COUNT(*) FROM tasks ${userId ? 'WHERE user_id = $1' : ''}`, userId ? [userId] : []),
    client.query(`SELECT COUNT(*) FROM tasks ${userId ? 'WHERE user_id = $1 AND status = ' + `'done'` : "WHERE status = 'done'"}`, userId ? [userId] : []),
    client.query(`SELECT COUNT(*) FROM habits ${userId ? 'WHERE user_id = $1' : ''}`, userId ? [userId] : []),
    client.query(`SELECT COALESCE(SUM(COALESCE(actual_duration, duration)), 0) as total, COUNT(*) as cnt FROM focus_sessions ${userId ? 'WHERE user_id = $1' : ''}`, userId ? [userId] : []),
    client.query(`SELECT type, amount FROM financial_transactions ${userId ? 'WHERE user_id = $1' : ''}`, userId ? [userId] : []),
  ])

  const totalTransactions = financeSummary.rowCount ?? 0
  const totalExpenses = (financeSummary.rows || [])
    .filter((r: any) => r.type === 'expense')
    .reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0)

  res.json({
    tasks: { total: String(taskTotal.rows?.[0]?.count ?? 0), completed: String(taskCompleted.rows?.[0]?.count ?? 0) },
    habits: { total: String(habitTotal.rows?.[0]?.count ?? 0) },
    finance: { total: String(totalTransactions), total_expenses: totalExpenses.toFixed(2) },
    focus: { total: String(focusSummary.rows?.[0]?.cnt ?? 0), total_focus_time: String(focusSummary.rows?.[0]?.total ?? 0) },
  })
})
