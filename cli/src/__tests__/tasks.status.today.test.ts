import { describe, it, expect, vi, beforeEach } from 'vitest'
import { format } from 'date-fns'

const dm = {
  init: vi.fn(),
  getTodoItems: vi.fn(),
  getTodoCategories: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Cat', color: '#000', todos: [] }]),
  updateTodoItem: vi.fn(),
}

vi.mock('../data.js', () => ({ dataManager: dm }))
vi.mock('../config.js', () => ({ loadConfig: vi.fn().mockResolvedValue({}) }))
vi.mock('inquirer', () => ({ default: { prompt: vi.fn().mockResolvedValue({ status: 'done' }) } }))
vi.mock('ora', () => ({ default: () => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn(), info: vi.fn() }) }) }))
vi.mock('chalk', () => ({
  default: (() => {
    const color = (s: any): string => String(s)
    const boldFn = Object.assign((s: any): string => String(s), { blue: color, red: color })
    return { green: color, gray: color, cyan: color, white: color, red: color, blue: color, magenta: color, yellow: color, bold: boldFn }
  })()
}))

describe('cli tasks status & today', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates task status to done', async () => {
    const now = new Date()
    dm.getTodoItems.mockResolvedValue([{ id: 't1', title: 'My Task', status: 'need-to-start', priority: 'medium', categoryId: 'c1', createdAt: now, tags: [] }])
    const { handleUpdateTaskStatus } = await import('../commands/tasks')
    await handleUpdateTaskStatus('My', {})
    expect(dm.updateTodoItem).toHaveBeenCalled()
    const [idArg, updates] = dm.updateTodoItem.mock.calls[0]
    expect(idArg).toBe('t1')
    expect((updates).status).toBeDefined()
  })

  it("prints today's overview", async () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24*60*60*1000)
    dm.getTodoItems.mockResolvedValue([
      { id: 't1', title: 'Due today', status: 'need-to-start', priority: 'low', categoryId: 'c1', dueDate: today, createdAt: today, tags: [] },
      { id: 't2', title: 'Overdue', status: 'need-to-start', priority: 'low', categoryId: 'c1', dueDate: yesterday, createdAt: yesterday, tags: [] },
    ])

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const { handleTodayOverview } = await import('../commands/tasks')
    await handleTodayOverview()

    const output = infoSpy.mock.calls.map((c) => c.join(' ')).join('\n')
    expect(output).toContain(format(today, 'EEEE, MMMM d, yyyy'))
    expect(output).toContain('📊 Quick Stats:')
    infoSpy.mockRestore()
  })
})
