import { describe, it, expect, vi, beforeEach } from 'vitest'

const dm = {
  init: vi.fn(),
  getTodoItems: vi.fn(),
  updateTodoItem: vi.fn(),
  deleteTodoItem: vi.fn(),
}

vi.mock('../data.js', () => ({ dataManager: dm }))
vi.mock('../config.js', () => ({ loadConfig: vi.fn().mockResolvedValue({}) }))
vi.mock('ora', () => ({ default: () => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn(), info: vi.fn() }) }) }))
const promptMock = vi.fn()
vi.mock('inquirer', () => ({ default: { prompt: promptMock } }))
vi.mock('chalk', () => ({
  default: (() => {
    const color = (s: any) => String(s)
    const boldFn = Object.assign((s: any) => String(s), { blue: color, red: color })
    return { green: color, gray: color, cyan: color, white: color, red: color, blue: color, magenta: color, yellow: color, bold: boldFn }
  })()
}))

describe('cli task mutations (done/start/remove)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks a task as done via handleCompleteTask', async () => {
    const now = new Date()
    dm.getTodoItems.mockResolvedValue([{ id: 't1', title: 'My Task', status: 'need-to-start', priority: 'medium', categoryId: 'c1', createdAt: now, tags: [] }])
    const { handleCompleteTask } = await import('../commands/tasks')
    const res = await handleCompleteTask('My')
    expect(dm.updateTodoItem).toHaveBeenCalled()
    const [id, updates] = dm.updateTodoItem.mock.calls[0]
    expect(id).toBe('t1')
    expect((updates as any).status).toBe('done')
    expect(res).toEqual({ id: 't1', status: 'done' })
  })

  it('starts working on a task via handleStartTask', async () => {
    const now = new Date()
    dm.getTodoItems.mockResolvedValue([{ id: 't2', title: 'Start Me', status: 'need-to-start', priority: 'low', categoryId: 'c1', createdAt: now, tags: [] }])
    const { handleStartTask } = await import('../commands/tasks')
    const res = await handleStartTask('Start')
    expect(dm.updateTodoItem).toHaveBeenCalled()
    const [id, updates] = dm.updateTodoItem.mock.calls[0]
    expect(id).toBe('t2')
    expect((updates as any).status).toBe('currently-working')
    expect(res).toEqual({ id: 't2', status: 'currently-working' })
  })

  it('removes a task via handleRemoveTask with confirm', async () => {
    const now = new Date()
    dm.getTodoItems.mockResolvedValue([{ id: 't3', title: 'Remove Me', status: 'need-to-start', priority: 'low', categoryId: 'c1', createdAt: now, tags: [] }])
    promptMock.mockResolvedValue({ confirm: true })
    const { handleRemoveTask } = await import('../commands/tasks')
    const res = await handleRemoveTask('Remove')
    expect(dm.deleteTodoItem).toHaveBeenCalledWith('t3')
    expect(res).toEqual({ id: 't3' })
  })

  it('does not remove when user cancels', async () => {
    const now = new Date()
    dm.getTodoItems.mockResolvedValue([{ id: 't4', title: 'Do Not Remove', status: 'need-to-start', priority: 'low', categoryId: 'c1', createdAt: now, tags: [] }])
    promptMock.mockResolvedValue({ confirm: false })
    const { handleRemoveTask } = await import('../commands/tasks')
    const res = await handleRemoveTask('Do Not')
    expect(dm.deleteTodoItem).not.toHaveBeenCalled()
    expect(res).toBeNull()
  })

  it('returns null and no-op when task not found (status)', async () => {
    dm.getTodoItems.mockResolvedValue([])
    const { handleUpdateTaskStatus } = await import('../commands/tasks')
    const res = await handleUpdateTaskStatus('Missing', { status: 'done' })
    expect(res).toBeNull()
    expect(dm.updateTodoItem).not.toHaveBeenCalled()
  })
})
