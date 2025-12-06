/// <reference types="vitest" />
import { describe, expect, it, vi } from 'vitest'

// Unit-style controller tests without starting HTTP server

// Mock repos for controllers
vi.mock('../src/modules/shopping/shopping.repository.ts', () => ({
  listShoppingLists: vi.fn().mockResolvedValue([{ id: 'list-1', name: 'My List' }]),
}))
vi.mock('../src/modules/recipes/recipe.repository.ts', () => ({
  listRecipes: vi.fn().mockResolvedValue([]),
}))

vi.mock('../src/modules/pantry/pantry.repository.ts', () => ({
  listPantryItems: vi.fn().mockResolvedValue([{ id: 'pantry-1', name: 'Olive Oil' }]),
  createPantryItem: vi.fn().mockResolvedValue({ id: 'pantry-2', name: 'Salt' }),
}))

vi.mock('../src/modules/meal/meal.repository.ts', () => ({
  listMealPlans: vi.fn().mockResolvedValue([{ id: 'plan-1', name: 'Week 42', week_start_date: '2025-10-20' }]),
}))

vi.mock('../src/modules/focus/focus.repository.ts', () => ({
  listFocusSessions: vi.fn().mockResolvedValue([{ id: 'fs-1', preset: 'pomodoro', duration: 25, start_time: new Date().toISOString() }]),
}))

vi.mock('../src/modules/habits/habit.repository.ts', () => ({
  listHabits: vi.fn().mockResolvedValue([{ id: 'habit-1', name: 'Read' }]),
  createHabit: vi.fn().mockResolvedValue({ id: 'habit-2', name: 'Walk' }),
}))

vi.mock('../src/modules/finance/finance.repository.ts', () => ({
  listAccounts: vi.fn().mockResolvedValue([{ id: 'acct-1', name: 'Checking', type: 'checking' }]),
  listTransactions: vi.fn().mockResolvedValue([{ id: 'txn-1', type: 'expense', amount: 12.34, date: '2025-10-20' }]),
}))

import { getShoppingLists } from '../src/modules/shopping/shopping.controller'
import { getRecipes } from '../src/modules/recipes/recipe.controller'
import { getPantryItems, postPantryItem } from '../src/modules/pantry/pantry.controller'
import { getMealPlans } from '../src/modules/meal/meal.controller'
import { getFocusSessions } from '../src/modules/focus/focus.controller'
import { getHabits, postHabit } from '../src/modules/habits/habit.controller'
import { getAccounts, getTransactions } from '../src/modules/finance/finance.controller'

function mockRes() {
  const res: any = {}
  res.statusCode = 200
  res.status = (code: number) => { res.statusCode = code; return res }
  res.json = (payload: unknown) => { res.body = payload; return res }
  return res
}

describe('Controllers', () => {
  it('shopping: getShoppingLists returns mocked lists', async () => {
    const req: any = { userId: 'test-user' }
    const res = mockRes()
    await getShoppingLists(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].id).toBe('list-1')
  })

  it('recipes: getRecipes returns empty array', async () => {
    const req: any = { userId: 'test-user' }
    const res = mockRes()
    await getRecipes(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(0)
  })

  it('pantry: getPantryItems returns mocked items', async () => {
    const req: any = { userId: 'test-user' }
    const res = mockRes()
    await getPantryItems(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].name).toBe('Olive Oil')
  })

  it('pantry: postPantryItem returns 201 and item', async () => {
    const req: any = { userId: 'test-user', body: { name: 'Salt' } }
    const res = mockRes()
    await postPantryItem(req, res, () => {})
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBe('pantry-2')
  })

  it('meal: getMealPlans returns mocked plans', async () => {
    const req: any = { userId: 'test-user' }
    const res = mockRes()
    await getMealPlans(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(res.body[0].id).toBe('plan-1')
  })

  it('focus: getFocusSessions returns mocked sessions', async () => {
    const req: any = { userId: 'test-user' }
    const res = mockRes()
    await getFocusSessions(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(res.body[0].id).toBe('fs-1')
  })

  it('habits: getHabits returns mocked habits', async () => {
    const req: any = { userId: 'test-user' }
    const res = mockRes()
    await getHabits(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(res.body[0].id).toBe('habit-1')
  })

  it('habits: postHabit returns 201 and habit', async () => {
    const req: any = { userId: 'test-user', body: { name: 'Walk' } }
    const res = mockRes()
    await postHabit(req, res, () => {})
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBe('habit-2')
  })

  it('finance: getAccounts returns mocked accounts', async () => {
    const req: any = { userId: 'test-user', query: {} }
    const res = mockRes()
    await getAccounts(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(res.body[0].id).toBe('acct-1')
  })

  it('finance: getTransactions returns mocked transactions', async () => {
    const req: any = { userId: 'test-user', query: {} }
    const res = mockRes()
    await getTransactions(req, res, () => {})
    expect(res.statusCode).toBe(200)
    expect(res.body[0].id).toBe('txn-1')
  })
})
