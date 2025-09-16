import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { format, parseISO, addDays } from 'date-fns';
import { dataManager } from '../data.js';
import { TodoItem, TodoCategory } from '../types.js';
import { loadConfig } from '../config.js';

export function createTasksCommand(): Command {
  const tasks = new Command('tasks')
    .alias('todo')
    .description('Manage tasks and todos');

  // Add task
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
    .action(async (title, options) => {
      await dataManager.init();
      const config = await loadConfig();

      let taskTitle = title;
      let description = options.description;
      let priority = options.priority || 'medium';
      let category = options.category;
      let dueDate = options.due ? parseDate(options.due) : undefined;
      let tags = options.tags ? options.tags.split(',').map((tag: string) => tag.trim()) : [];
      let estimatedTime = options.time ? parseInt(options.time) : undefined;

      // Interactive mode if no title provided
      if (!taskTitle) {
        const categories = await dataManager.getTodoCategories();
        const categoryChoices = categories.map(c => ({ name: `${c.name} (${c.color})`, value: c.id }));

        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Task title:',
            validate: (input) => input.trim() !== '' || 'Task title is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):'
          },
          {
            type: 'list',
            name: 'priority',
            message: 'Priority:',
            choices: [
              { name: '🟢 Low', value: 'low' },
              { name: '🟡 Medium', value: 'medium' },
              { name: '🟠 High', value: 'high' },
              { name: '🔴 Urgent', value: 'urgent' }
            ],
            default: 'medium'
          },
          {
            type: 'list',
            name: 'category',
            message: 'Category:',
            choices: [
              ...categoryChoices,
              { name: 'Create new category', value: 'new' }
            ],
            when: categoryChoices.length > 0
          },
          {
            type: 'input',
            name: 'newCategoryName',
            message: 'New category name:',
            when: (answers) => answers.category === 'new' || categoryChoices.length === 0
          },
          {
            type: 'input',
            name: 'dueDate',
            message: 'Due date (optional, YYYY-MM-DD or day name):',
            filter: (input) => input ? parseDate(input) : undefined
          },
          {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated, optional):',
            filter: (input) => input ? input.split(',').map((tag: string) => tag.trim()) : []
          },
          {
            type: 'number',
            name: 'estimatedTime',
            message: 'Estimated time in minutes (optional):'
          }
        ]);

        taskTitle = answers.title;
        description = answers.description;
        priority = answers.priority;
        category = answers.category === 'new' ? answers.newCategoryName : answers.category;
        dueDate = answers.dueDate;
        tags = answers.tags;
        estimatedTime = answers.estimatedTime;

        // Create new category if needed
        if (answers.category === 'new' || categoryChoices.length === 0) {
          const newCategory = await dataManager.addTodoCategory({
            name: answers.newCategoryName || category || 'General',
            color: '#6b7280',
            todos: []
          });
          category = newCategory.id;
        }
      }

      const spinner = ora('Adding task...').start();

      try {
        const task = await dataManager.addTodoItem({
          title: taskTitle,
          description,
          priority,
          categoryId: category || 'default',
          status: 'need-to-start',
          dueDate,
          tags,
          estimatedTime
        });

        spinner.succeed(chalk.green(`Added task "${task.title}"`));
        console.log(chalk.gray(`  Priority: ${priority} | Category: ${category || 'default'}`));
        if (dueDate) console.log(chalk.gray(`  Due: ${format(dueDate, 'MMM d, yyyy')}`));
        if (estimatedTime) console.log(chalk.gray(`  Estimated time: ${estimatedTime} minutes`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to add task'));
        console.error(error);
      }
    });

  // List tasks
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
    .action(async (options) => {
      await dataManager.init();

      const spinner = ora('Loading tasks...').start();

      try {
        const tasks = await dataManager.getTodoItems();
        const categories = await dataManager.getTodoCategories();
        let filteredTasks = tasks;

        // Apply filters
        if (options.status) {
          filteredTasks = filteredTasks.filter(task => task.status === options.status);
        }

        if (options.priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === options.priority);
        }

        if (options.category) {
          const category = categories.find(c => c.name.toLowerCase().includes(options.category.toLowerCase()));
          if (category) {
            filteredTasks = filteredTasks.filter(task => task.categoryId === category.id);
          }
        }

        if (options.tag) {
          filteredTasks = filteredTasks.filter(task => 
            task.tags.some(tag => tag.toLowerCase().includes(options.tag.toLowerCase()))
          );
        }

        if (options.due) {
          filteredTasks = filteredTasks.filter(task => task.dueDate);
        }

        if (options.overdue) {
          const now = new Date();
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) < now && task.status !== 'done'
          );
        }

        if (options.today) {
          const today = new Date();
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return format(taskDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          });
        }

        if (options.week) {
          const today = new Date();
          const weekEnd = addDays(today, 7);
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= today && taskDate <= weekEnd;
          });
        }

        spinner.succeed(chalk.green(`Found ${filteredTasks.length} tasks`));

        if (filteredTasks.length === 0) {
          console.log(chalk.yellow('No tasks found'));
          return;
        }

        // Group by status
        const statusGroups = {
          'need-to-start': filteredTasks.filter(t => t.status === 'need-to-start'),
          'currently-working': filteredTasks.filter(t => t.status === 'currently-working'),
          'pending-others': filteredTasks.filter(t => t.status === 'pending-others'),
          'done': filteredTasks.filter(t => t.status === 'done')
        };

        Object.entries(statusGroups).forEach(([status, statusTasks]) => {
          if (statusTasks.length === 0) return;

          const statusLabels = {
            'need-to-start': '📋 Need to Start',
            'currently-working': '🔄 Currently Working',
            'pending-others': '⏳ Pending Others',
            'done': '✅ Done'
          };

          console.log(`\n${chalk.bold.blue(statusLabels[status as keyof typeof statusLabels])}`);
          
          statusTasks.forEach(task => {
            const priorityColors = {
              low: chalk.gray,
              medium: chalk.yellow,
              high: chalk.magenta,
              urgent: chalk.red
            };

            const priorityIcon = task.priority === 'urgent' ? '🔴' :
                               task.priority === 'high' ? '🟠' :
                               task.priority === 'medium' ? '🟡' : '🟢';

            const statusIcon = task.status === 'done' ? '✅' :
                              task.status === 'currently-working' ? '🔄' :
                              task.status === 'pending-others' ? '⏳' : '○';

            const category = categories.find(c => c.id === task.categoryId);
            
            console.log(`  ${statusIcon} ${chalk.white(task.title)}`);
            
            const details = [];
            details.push(`${priorityIcon} ${task.priority}`);
            if (category) details.push(`📁 ${category.name}`);
            if (task.dueDate) {
              const dueColor = new Date(task.dueDate) < new Date() ? chalk.red : chalk.blue;
              details.push(dueColor(`📅 ${format(new Date(task.dueDate), 'MMM d')}`));
            }
            if (task.estimatedTime) details.push(`⏱️ ${task.estimatedTime}m`);
            
            console.log(`    ${chalk.gray(details.join(' • '))}`);
            
            if (task.description) {
              console.log(`    ${chalk.gray(task.description)}`);
            }
            
            if (task.tags.length > 0) {
              console.log(`    ${chalk.cyan(task.tags.map(tag => `#${tag}`).join(' '))}`);
            }
          });
        });

      } catch (error) {
        spinner.fail(chalk.red('Failed to load tasks'));
        console.error(error);
      }
    });

  // Update task status
  tasks
    .command('status')
    .alias('s')
    .description('Update task status')
    .argument('<query>', 'Task title or ID')
    .option('-s, --status <status>', 'Status (need-to-start, currently-working, pending-others, done)')
    .action(async (query, options) => {
      await dataManager.init();

      const spinner = ora('Updating task status...').start();

      try {
        const tasks = await dataManager.getTodoItems();
        const task = tasks.find(t => 
          t.id === query || 
          t.title.toLowerCase().includes(query.toLowerCase())
        );

        if (!task) {
          spinner.fail(chalk.red('Task not found'));
          return;
        }

        let status = options.status;
        if (!status) {
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'status',
              message: 'Update status to:',
              choices: [
                { name: '📋 Need to Start', value: 'need-to-start' },
                { name: '🔄 Currently Working', value: 'currently-working' },
                { name: '⏳ Pending Others', value: 'pending-others' },
                { name: '✅ Done', value: 'done' }
              ]
            }
          ]);
          status = answer.status;
        }

        const updates: Partial<TodoItem> = { 
          status,
          updatedAt: new Date()
        };
        
        if (status === 'done') {
          updates.completedAt = new Date();
        }

        await dataManager.updateTodoItem(task.id, updates);

        spinner.succeed(chalk.green(`Updated "${task.title}" status to ${status}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to update task status'));
        console.error(error);
      }
    });

  // Complete task (shortcut for marking as done)
  tasks
    .command('done')
    .alias('complete')
    .description('Mark task as completed')
    .argument('<query>', 'Task title or ID')
    .action(async (query) => {
      await dataManager.init();

      const spinner = ora('Marking task as done...').start();

      try {
        const tasks = await dataManager.getTodoItems();
        const task = tasks.find(t => 
          t.id === query || 
          t.title.toLowerCase().includes(query.toLowerCase())
        );

        if (!task) {
          spinner.fail(chalk.red('Task not found'));
          return;
        }

        await dataManager.updateTodoItem(task.id, {
          status: 'done',
          completedAt: new Date(),
          updatedAt: new Date()
        });

        spinner.succeed(chalk.green(`✅ Completed "${task.title}"`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to complete task'));
        console.error(error);
      }
    });

  // Start working on task
  tasks
    .command('start')
    .alias('work')
    .description('Start working on task')
    .argument('<query>', 'Task title or ID')
    .action(async (query) => {
      await dataManager.init();

      const spinner = ora('Starting work on task...').start();

      try {
        const tasks = await dataManager.getTodoItems();
        const task = tasks.find(t => 
          t.id === query || 
          t.title.toLowerCase().includes(query.toLowerCase())
        );

        if (!task) {
          spinner.fail(chalk.red('Task not found'));
          return;
        }

        await dataManager.updateTodoItem(task.id, {
          status: 'currently-working',
          updatedAt: new Date()
        });

        spinner.succeed(chalk.green(`🔄 Started working on "${task.title}"`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to start task'));
        console.error(error);
      }
    });

  // Remove task
  tasks
    .command('remove')
    .alias('rm')
    .description('Remove task')
    .argument('<query>', 'Task title or ID')
    .action(async (query) => {
      await dataManager.init();

      const spinner = ora('Removing task...').start();

      try {
        const tasks = await dataManager.getTodoItems();
        const task = tasks.find(t => 
          t.id === query || 
          t.title.toLowerCase().includes(query.toLowerCase())
        );

        if (!task) {
          spinner.fail(chalk.red('Task not found'));
          return;
        }

        const confirmed = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Remove task "${task.title}"?`,
          default: false
        }]);

        if (!confirmed.confirm) {
          spinner.info(chalk.yellow('Cancelled'));
          return;
        }

        await dataManager.deleteTodoItem(task.id);
        spinner.succeed(chalk.green(`Removed task "${task.title}"`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to remove task'));
        console.error(error);
      }
    });

  // Today's tasks
  tasks
    .command('today')
    .description('Show today\'s tasks and summary')
    .action(async () => {
      await dataManager.init();

      const spinner = ora('Loading today\'s tasks...').start();

      try {
        const tasks = await dataManager.getTodoItems();
        const categories = await dataManager.getTodoCategories();
        
        const today = new Date();
        const todaysTasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          return format(new Date(task.dueDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        });

        const overdueTasks = tasks.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) < today && 
          task.status !== 'done'
        );

        const currentlyWorking = tasks.filter(task => task.status === 'currently-working');

        spinner.succeed(chalk.green('Today\'s Overview'));

        console.log(chalk.bold.blue(`\n📅 ${format(today, 'EEEE, MMMM d, yyyy')}`));

        if (currentlyWorking.length > 0) {
          console.log(chalk.bold('\n🔄 Currently Working On:'));
          currentlyWorking.forEach(task => {
            console.log(`  • ${chalk.white(task.title)}`);
          });
        }

        if (overdueTasks.length > 0) {
          console.log(chalk.bold.red('\n⚠️ Overdue Tasks:'));
          overdueTasks.forEach(task => {
            const category = categories.find(c => c.id === task.categoryId);
            console.log(`  • ${chalk.red(task.title)} (${category?.name || 'Unknown'})`);
          });
        }

        if (todaysTasks.length > 0) {
          console.log(chalk.bold('\n📋 Due Today:'));
          todaysTasks.forEach(task => {
            const statusIcon = task.status === 'done' ? '✅' :
                              task.status === 'currently-working' ? '🔄' : '○';
            console.log(`  ${statusIcon} ${chalk.white(task.title)}`);
          });
        }

        if (todaysTasks.length === 0 && overdueTasks.length === 0 && currentlyWorking.length === 0) {
          console.log(chalk.green('\n🎉 All caught up! No tasks for today.'));
        }

        // Quick stats
        const totalPending = tasks.filter(t => t.status !== 'done').length;
        const completedToday = tasks.filter(t => 
          t.completedAt && 
          format(new Date(t.completedAt), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        ).length;

        console.log(chalk.bold('\n📊 Quick Stats:'));
        console.log(`  • ${totalPending} pending tasks`);
        console.log(`  • ${completedToday} completed today`);

      } catch (error) {
        spinner.fail(chalk.red('Failed to load today\'s tasks'));
        console.error(error);
      }
    });

  return tasks;
}

function parseDate(dateStr: string): Date {
  // Handle day names
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = dayNames.indexOf(dateStr.toLowerCase());
  
  if (dayIndex !== -1) {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
    return addDays(today, daysUntilTarget === 0 ? 7 : daysUntilTarget);
  }

  // Handle relative terms
  if (dateStr.toLowerCase() === 'today') {
    return new Date();
  }
  if (dateStr.toLowerCase() === 'tomorrow') {
    return addDays(new Date(), 1);
  }

  // Try to parse as date
  try {
    return parseISO(dateStr);
  } catch {
    return new Date();
  }
}