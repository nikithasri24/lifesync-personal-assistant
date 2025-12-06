import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { format, parseISO, addDays } from 'date-fns';
import { dataManager } from '../data.js';
import { TodoItem } from '../types.js';
import { loadConfig } from '../config.js';

type Deps = {
  dataManager: typeof dataManager,
  loadConfig: typeof loadConfig,
  inquirer: typeof inquirer,
  ora: typeof ora,
  chalk: typeof chalk,
}

export async function handleAddTask(
  title: string | undefined,
  options: any,
  deps: Deps = { dataManager, loadConfig, inquirer, ora, chalk }
) {
  const { dataManager: dm, loadConfig: loadCfg, inquirer: iq, ora: Ora, chalk: Chalk } = deps

  await dm.init();
  await loadCfg();

  let taskTitle = title;
  let description = options?.description;
  let priority = options?.priority || 'medium';
  let category = options?.category;
  let dueDate = options?.due ? parseDate(options.due) : undefined;
  let tags = options?.tags ? (Array.isArray(options.tags) ? options.tags : String(options.tags).split(',').map((tag: string) => tag.trim())) : [];
  let estimatedTime = options?.time ? parseInt(String(options.time)) : undefined;

  if (!taskTitle) {
    const categories = await dm.getTodoCategories();
    const categoryChoices = categories.map(c => ({ name: `${c.name} (${c.color})`, value: c.id }));

    const answers: any = await iq.prompt([
      { type: 'input', name: 'title', message: 'Task title:', validate: (input: string) => input.trim() !== '' || 'Task title is required' },
      { type: 'input', name: 'description', message: 'Description (optional):' },
      { type: 'list', name: 'priority', message: 'Priority:', choices: [
        { name: '🟢 Low', value: 'low' },
        { name: '🟡 Medium', value: 'medium' },
        { name: '🟠 High', value: 'high' },
        { name: '🔴 Urgent', value: 'urgent' }
      ], default: 'medium' },
      { type: 'list', name: 'category', message: 'Category:', choices: [ ...categoryChoices, { name: 'Create new category', value: 'new' } ], when: categoryChoices.length > 0 },
      { type: 'input', name: 'newCategoryName', message: 'New category name:', when: (a: any) => a.category === 'new' || categoryChoices.length === 0 },
      { type: 'input', name: 'dueDate', message: 'Due date (optional, YYYY-MM-DD or day name):', filter: (input: string) => input ? parseDate(input) : undefined },
      { type: 'input', name: 'tags', message: 'Tags (comma-separated, optional):', filter: (input: string) => input ? input.split(',').map((tag: string) => tag.trim()) : [] },
      { type: 'number', name: 'estimatedTime', message: 'Estimated time in minutes (optional):' }
    ]);

    taskTitle = answers.title;
    description = answers.description;
    priority = answers.priority;
    category = answers.category === 'new' ? answers.newCategoryName : answers.category;
    dueDate = answers.dueDate;
    tags = answers.tags;
    estimatedTime = answers.estimatedTime;

    if (answers.category === 'new' || categoryChoices.length === 0) {
      const newCategory = await dm.addTodoCategory({ name: answers.newCategoryName || category || 'General', color: '#6b7280', todos: [] });
      category = newCategory.id;
    }
  }

  const spinner = Ora('Adding task...').start();

  try {
    const task = await dm.addTodoItem({
      title: taskTitle!,
      description,
      priority,
      categoryId: category || 'default',
      status: 'need-to-start',
      dueDate,
      tags,
      estimatedTime
    } as any);

    spinner.succeed(Chalk.green(`Added task "${task.title}"`));
    console.log(Chalk.gray(`  Priority: ${priority} | Category: ${category || 'default'}`));
    if (dueDate) console.log(Chalk.gray(`  Due: ${format(dueDate, 'MMM d, yyyy')}`));
    if (estimatedTime) console.log(Chalk.gray(`  Estimated time: ${estimatedTime} minutes`));

    return task;
  } catch (error) {
    spinner.fail(Chalk.red('Failed to add task'));
    console.error(error);
    throw error;
  }
}

export async function handleListTasks(
  options: any,
  deps: Deps = { dataManager, loadConfig, inquirer, ora, chalk }
) {
  const { dataManager: dm, ora: Ora, chalk: Chalk } = deps
  await dm.init()
  const spinner = Ora('Loading tasks...').start()
  try {
    const tasks = await dm.getTodoItems()
    const categories = await dm.getTodoCategories()
    let filteredTasks = tasks

    if (options.status) filteredTasks = filteredTasks.filter(task => task.status === options.status)
    if (options.priority) filteredTasks = filteredTasks.filter(task => task.priority === options.priority)
    if (options.category) {
      const category = categories.find(c => c.name.toLowerCase().includes(options.category.toLowerCase()))
      if (category) filteredTasks = filteredTasks.filter(task => task.categoryId === category.id)
    }
    if (options.tag) filteredTasks = filteredTasks.filter(task => task.tags.some(tag => tag.toLowerCase().includes(options.tag.toLowerCase())))
    if (options.due) filteredTasks = filteredTasks.filter(task => task.dueDate)
    if (options.overdue) {
      const now = new Date()
      filteredTasks = filteredTasks.filter(task => task.dueDate && new Date(task.dueDate) < now && task.status !== 'done')
    }
    if (options.today) {
      const today = new Date()
      filteredTasks = filteredTasks.filter(task => task.dueDate && format(new Date(task.dueDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    }
    if (options.week) {
      const today = new Date()
      const weekEnd = addDays(today, 7)
      filteredTasks = filteredTasks.filter(task => task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) <= weekEnd)
    }

    spinner.succeed(Chalk.green(`Found ${filteredTasks.length} tasks`))
    if (filteredTasks.length === 0) {
      console.log(Chalk.yellow('No tasks found'))
      return filteredTasks
    }

    const statusGroups = {
      'need-to-start': filteredTasks.filter(t => t.status === 'need-to-start'),
      'currently-working': filteredTasks.filter(t => t.status === 'currently-working'),
      'pending-others': filteredTasks.filter(t => t.status === 'pending-others'),
      'done': filteredTasks.filter(t => t.status === 'done')
    } as const

    Object.entries(statusGroups).forEach(([status, statusTasks]) => {
      if (statusTasks.length === 0) return
      const statusLabels = {
        'need-to-start': '📋 Need to Start',
        'currently-working': '🔄 Currently Working',
        'pending-others': '⏳ Pending Others',
        'done': '✅ Done'
      } as const
      console.log(`\n${Chalk.bold.blue(statusLabels[status as keyof typeof statusLabels])}`)
      statusTasks.forEach(task => {
        const priorityIcon = task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟠' : task.priority === 'medium' ? '🟡' : '🟢'
        const statusIcon = task.status === 'done' ? '✅' : task.status === 'currently-working' ? '🔄' : task.status === 'pending-others' ? '⏳' : '○'
        const category = categories.find(c => c.id === task.categoryId)
        console.log(`  ${statusIcon} ${Chalk.white(task.title)}`)
        const details: string[] = []
        details.push(`${priorityIcon} ${task.priority}`)
        if (category) details.push(`📁 ${category.name}`)
        if (task.dueDate) {
          const dueColor = new Date(task.dueDate) < new Date() ? Chalk.red : Chalk.blue
          details.push(dueColor(`📅 ${format(new Date(task.dueDate), 'MMM d')}`))
        }
        if (task.estimatedTime) details.push(`⏱️ ${task.estimatedTime}m`)
        console.log(`    ${Chalk.gray(details.join(' • '))}`)
        if (task.description) console.log(`    ${Chalk.gray(task.description)}`)
        if (task.tags.length > 0) console.log(`    ${Chalk.cyan(task.tags.map(tag => `#${tag}`).join(' '))}`)
      })
    })
    return filteredTasks
  } catch (error) {
    spinner.fail(Chalk.red('Failed to load tasks'))
    console.error(error)
    throw error
  }
}

export async function handleUpdateTaskStatus(
  query: string,
  options: any,
  deps: Deps = { dataManager, loadConfig, inquirer, ora, chalk }
) {
  const { dataManager: dm, inquirer: iq, ora: Ora, chalk: Chalk } = deps
  await dm.init()
  const spinner = Ora('Updating task status...').start()
  try {
    const tasks = await dm.getTodoItems()
    const task = tasks.find(t => t.id === query || t.title.toLowerCase().includes(query.toLowerCase()))
    if (!task) {
      spinner.fail(Chalk.red('Task not found'))
      return null
    }
    let status = options?.status
    if (!status) {
      const answer: any = await iq.prompt([
        { type: 'list', name: 'status', message: 'Update status to:', choices: [
          { name: '📋 Need to Start', value: 'need-to-start' },
          { name: '🔄 Currently Working', value: 'currently-working' },
          { name: '⏳ Pending Others', value: 'pending-others' },
          { name: '✅ Done', value: 'done' }
        ] }
      ])
      status = answer.status
    }
    const updates: Partial<TodoItem> = { status, updatedAt: new Date() }
    if (status === 'done') updates.completedAt = new Date()
    await dm.updateTodoItem(task.id, updates)
    spinner.succeed(Chalk.green(`Updated "${task.title}" status to ${status}`))
    return updates
  } catch (error) {
    spinner.fail(Chalk.red('Failed to update task status'))
    console.error(error)
    throw error
  }
}

export async function handleTodayOverview(
  deps: Deps = { dataManager, loadConfig, inquirer, ora, chalk }
) {
  const { dataManager: dm, ora: Ora, chalk: Chalk } = deps
  await dm.init()
  const spinner = Ora("Loading today's tasks...").start()
  try {
    const tasks = await dm.getTodoItems()
    const categories = await dm.getTodoCategories()
    const today = new Date()
    const todaysTasks = tasks.filter(task => task.dueDate && format(new Date(task.dueDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    const overdueTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate) < today && task.status !== 'done')
    const currentlyWorking = tasks.filter(task => task.status === 'currently-working')
    spinner.succeed(Chalk.green("Today's Overview"))
    console.log(Chalk.bold.blue(`\n📅 ${format(today, 'EEEE, MMMM d, yyyy')}`))
    if (currentlyWorking.length > 0) {
      console.log(Chalk.bold('\n🔄 Currently Working On:'))
      currentlyWorking.forEach(task => console.log(`  • ${Chalk.white(task.title)}`))
    }
    if (overdueTasks.length > 0) {
      console.log(Chalk.bold.red('\n⚠️ Overdue Tasks:'))
      overdueTasks.forEach(task => {
        const category = categories.find(c => c.id === task.categoryId)
        console.log(`  • ${Chalk.red(task.title)} (${category?.name || 'Unknown'})`)
      })
    }
    if (todaysTasks.length > 0) {
      console.log(Chalk.bold('\n📋 Due Today:'))
      todaysTasks.forEach(task => {
        const statusIcon = task.status === 'done' ? '✅' : task.status === 'currently-working' ? '🔄' : '○'
        console.log(`  ${statusIcon} ${Chalk.white(task.title)}`)
      })
    }
    if (todaysTasks.length === 0 && overdueTasks.length === 0 && currentlyWorking.length === 0) {
      console.log(Chalk.green('\n🎉 All caught up! No tasks for today.'))
    }
    const totalPending = tasks.filter(t => t.status !== 'done').length
    const completedToday = tasks.filter(t => t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')).length
    console.log(Chalk.bold('\n📊 Quick Stats:'))
    console.log(`  • ${totalPending} pending tasks`)
    console.log(`  • ${completedToday} completed today`)
    return { todaysTasks, overdueTasks, currentlyWorking }
  } catch (error) {
    spinner.fail(Chalk.red("Failed to load today's tasks"))
    console.error(error)
    throw error
  }
}

export async function handleCompleteTask(
  query: string,
  deps: Deps = { dataManager, loadConfig, inquirer, ora, chalk }
) {
  const { dataManager: dm, ora: Ora, chalk: Chalk } = deps
  await dm.init()
  const spinner = Ora('Marking task as done...').start()
  try {
    const tasks = await dm.getTodoItems()
    const task = tasks.find(t => t.id === query || t.title.toLowerCase().includes(query.toLowerCase()))
    if (!task) {
      spinner.fail(Chalk.red('Task not found'))
      return null
    }
    await dm.updateTodoItem(task.id, { status: 'done', completedAt: new Date(), updatedAt: new Date() } as Partial<TodoItem>)
    spinner.succeed(Chalk.green(`✅ Completed "${task.title}"`))
    return { id: task.id, status: 'done' }
  } catch (error) {
    spinner.fail(Chalk.red('Failed to complete task'))
    console.error(error)
    throw error
  }
}

export async function handleStartTask(
  query: string,
  deps: Deps = { dataManager, loadConfig, inquirer, ora, chalk }
) {
  const { dataManager: dm, ora: Ora, chalk: Chalk } = deps
  await dm.init()
  const spinner = Ora('Starting work on task...').start()
  try {
    const tasks = await dm.getTodoItems()
    const task = tasks.find(t => t.id === query || t.title.toLowerCase().includes(query.toLowerCase()))
    if (!task) {
      spinner.fail(Chalk.red('Task not found'))
      return null
    }
    await dm.updateTodoItem(task.id, { status: 'currently-working', updatedAt: new Date() } as Partial<TodoItem>)
    spinner.succeed(Chalk.green(`🔄 Started working on "${task.title}"`))
    return { id: task.id, status: 'currently-working' }
  } catch (error) {
    spinner.fail(Chalk.red('Failed to start task'))
    console.error(error)
    throw error
  }
}

export async function handleRemoveTask(
  query: string,
  deps: Deps = { dataManager, loadConfig, inquirer, ora, chalk }
) {
  const { dataManager: dm, inquirer: iq, ora: Ora, chalk: Chalk } = deps
  await dm.init()
  const spinner = Ora('Removing task...').start()
  try {
    const tasks = await dm.getTodoItems()
    const task = tasks.find(t => t.id === query || t.title.toLowerCase().includes(query.toLowerCase()))
    if (!task) {
      spinner.fail(Chalk.red('Task not found'))
      return null
    }
    const confirmed: any = await iq.prompt([{ type: 'confirm', name: 'confirm', message: `Remove task "${task.title}"?`, default: false }])
    if (!confirmed.confirm) {
      spinner.info(Chalk.yellow('Cancelled'))
      return null
    }
    await dm.deleteTodoItem(task.id)
    spinner.succeed(Chalk.green(`Removed task "${task.title}"`))
    return { id: task.id }
  } catch (error) {
    spinner.fail(Chalk.red('Failed to remove task'))
    console.error(error)
    throw error
  }
}

export function createTasksCommand(): Command {
  const tasks = new Command('tasks')
    .alias('todo')
    .description('Manage tasks and todos')

  tasks
    .command('add')
    .alias('a')
    .description('Add new task')
    .argument('[title]', 'Task title')
    .option('-d, --description <string>', 'Task description')
    .option('-p, --priority <string>', 'Priority (low, medium, high, urgent)', 'medium')
    .option('-c, --category <string>', 'Category (personal, work, household)')
    .option('--due <date>', 'Due date (YYYY-MM-DD or day name)')
    .option('-t, --tags <string>', 'Tags (comma-separated)')
    .option('--time <number>', 'Estimated time in minutes')
    .action(async (title, options) => handleAddTask(title, options))

  tasks
    .command('list')
    .alias('ls')
    .description('List tasks')
    .option('-s, --status <string>', 'Filter by status')
    .option('-p, --priority <string>', 'Filter by priority')
    .option('-c, --category <string>', 'Filter by category')
    .option('-t, --tag <string>', 'Filter by tag')
    .option('--due', 'Show only tasks with due dates')
    .option('--overdue', 'Show only overdue tasks')
    .option('--today', 'Show tasks due today')
    .option('--week', 'Show tasks due this week')
    .action(async (options) => handleListTasks(options))

  tasks
    .command('status')
    .alias('s')
    .description('Update task status')
    .argument('<query>', 'Task title or ID')
    .option('-s, --status <status>', 'Status (need-to-start, currently-working, pending-others, done)')
    .action(async (query, options) => handleUpdateTaskStatus(query, options))

  tasks
    .command('done')
    .alias('complete')
    .description('Mark task as completed')
    .argument('<query>', 'Task title or ID')
    .action(async (query) => handleCompleteTask(query))

  tasks
    .command('start')
    .alias('work')
    .description('Start working on task')
    .argument('<query>', 'Task title or ID')
    .action(async (query) => handleStartTask(query))

  tasks
    .command('remove')
    .alias('rm')
    .description('Remove task')
    .argument('<query>', 'Task title or ID')
    .action(async (query) => handleRemoveTask(query))

  tasks
    .command('today')
    .description("Show today's tasks and summary")
    .action(async () => handleTodayOverview())

  return tasks
}

function parseDate(dateStr: string): Date {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = dayNames.indexOf(dateStr.toLowerCase());
  if (dayIndex !== -1) {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
    return addDays(today, daysUntilTarget === 0 ? 7 : daysUntilTarget);
  }
  if (dateStr.toLowerCase() === 'today') return new Date();
  if (dateStr.toLowerCase() === 'tomorrow') return addDays(new Date(), 1);
  try {
    return parseISO(dateStr);
  } catch {
    return new Date();
  }
}

