import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks
vi.mock('inquirer', () => ({ default: { prompt: vi.fn() } }))
vi.mock('ora', () => ({ default: () => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn(), info: vi.fn() }) }) }))
vi.mock('chalk', () => ({
  default: (() => {
    const color = (s: any) => String(s)
    const boldFn = Object.assign((s: any) => String(s), { blue: color, red: color })
    return { green: color, gray: color, cyan: color, white: color, red: color, blue: color, magenta: color, yellow: color, bold: boldFn }
  })()
}))

const dm = {
  init: vi.fn(),
  getTodoItems: vi.fn(),
  getTodoCategories: vi.fn(),
  addTodoItem: vi.fn(),
  updateTodoItem: vi.fn(),
  deleteTodoItem: vi.fn(),
}

vi.mock('../data.js', () => ({ dataManager: dm }))
vi.mock('../config.js', () => ({ loadConfig: vi.fn().mockResolvedValue({}) }))

describe('cli tasks command', () => {
  let logSpy: any
  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.useFakeTimers()
  })
  afterEach(() => {
    logSpy.mockRestore()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('lists tasks with tag filter', async () => {
    const now = new Date()
    dm.getTodoItems.mockResolvedValue([
      { id: '1', title: 'Work item', status: 'need-to-start', priority: 'medium', categoryId: 'c1', tags: ['work'], createdAt: now },
      { id: '2', title: 'Home item', status: 'done', priority: 'low', categoryId: 'c2', tags: ['home'], createdAt: now },
    ])
    dm.getTodoCategories.mockResolvedValue([
      { id: 'c1', name: 'Work', color: '#000', todos: [] },
      { id: 'c2', name: 'Home', color: '#000', todos: [] },
    ])

    const { handleListTasks } = await import('../commands/tasks')
    await handleListTasks({ tag: 'work' })

    expect(dm.getTodoItems).toHaveBeenCalled()
    // Expect output contains our filtered task title
    const printed = logSpy.mock.calls.map((c: any[]) => c.join(' ')).join('\n')
    expect(printed).toContain('Work item')
    expect(printed).not.toContain('Home item')
  })
})
