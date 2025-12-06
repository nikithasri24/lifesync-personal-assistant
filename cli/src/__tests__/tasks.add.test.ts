import { describe, it, expect, vi, beforeEach } from 'vitest'
import { format } from 'date-fns'

const dm = {
  init: vi.fn(),
  addTodoItem: vi.fn(),
  getTodoCategories: vi.fn().mockResolvedValue([]),
}

vi.mock('../data.js', () => ({ dataManager: dm }))
vi.mock('../config.js', () => ({ loadConfig: vi.fn().mockResolvedValue({}) }))
vi.mock('ora', () => ({ default: () => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn(), info: vi.fn() }) }) }))
vi.mock('chalk', () => ({ default: new Proxy({}, { get: () => (s: any) => String(s) }) }))

describe('cli tasks add', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds a task with flags (non-interactive)', async () => {
    dm.addTodoItem.mockResolvedValue({ id: 'x', title: 'Do it' })
    const { handleAddTask } = await import('../commands/tasks')
    await handleAddTask('Do it', { priority: 'high', due: '2025-01-01', tags: 'a,b', time: '30' })
    expect(dm.addTodoItem).toHaveBeenCalled()
    const args = dm.addTodoItem.mock.calls[0][0]
    expect(args.title).toBe('Do it')
    expect(args.priority).toBe('high')
    expect(args.estimatedTime).toBe(30)
    expect(args.tags).toEqual(['a', 'b'])
  })

  it('parses due date into a Date', async () => {
    dm.addTodoItem.mockResolvedValue({ id: 'x', title: 'Dated' })
    const { handleAddTask } = await import('../commands/tasks')
    await handleAddTask('Dated', { due: '2025-01-01' })
    const args = dm.addTodoItem.mock.calls[0][0]
    expect(args.dueDate instanceof Date).toBe(true)
    expect(format(args.dueDate, 'yyyy-MM-dd')).toBe('2025-01-01')
  })

  it('supports interactive mode via injected deps', async () => {
    const fakeDm = {
      init: vi.fn(),
      getTodoCategories: vi.fn().mockResolvedValue([]),
      addTodoCategory: vi.fn().mockResolvedValue({ id: 'newCat' }),
      addTodoItem: vi.fn().mockResolvedValue({ id: 'y', title: 'Interactive' }),
    }
    const fakeDeps = {
      dataManager: fakeDm as any,
      loadConfig: vi.fn().mockResolvedValue({}),
      inquirer: { prompt: vi.fn().mockResolvedValue({
        title: 'Interactive',
        description: 'Desc',
        priority: 'high',
        category: 'new',
        newCategoryName: 'Focus',
        dueDate: new Date('2025-01-02'),
        tags: ['x', 'y'],
        estimatedTime: 45,
      })} as any,
      ora: (() => ({ start: () => ({ succeed: vi.fn(), fail: vi.fn(), info: vi.fn() }) })) as any,
      chalk: new Proxy({}, { get: () => (s: any) => String(s) }) as any,
    }
    const { handleAddTask } = await import('../commands/tasks')
    await handleAddTask(undefined, {}, fakeDeps)

    expect(fakeDm.getTodoCategories).toHaveBeenCalled()
    expect(fakeDm.addTodoCategory).toHaveBeenCalled()
    const createdArgs = fakeDm.addTodoItem.mock.calls[0][0]
    expect(createdArgs.title).toBe('Interactive')
    expect(createdArgs.priority).toBe('high')
    expect(createdArgs.categoryId).toBe('newCat')
    expect(createdArgs.estimatedTime).toBe(45)
    expect(createdArgs.tags).toEqual(['x','y'])
  })
})
