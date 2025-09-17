#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { format } from 'date-fns';
import { createShoppingCommand } from './commands/shopping.js';
import { createMealsCommand } from './commands/meals.js';
import { createRecipesCommand } from './commands/recipes.js';
import { createConfigCommand } from './commands/config.js';
import { createSyncCommand } from './commands/sync.js';
import { createTasksCommand } from './commands/tasks.js';
import { ensureConfigExists } from './config.js';
import { dataManager } from './data.js';

const program = new Command();

// ASCII Art Logo
const logo = `
${chalk.bold.blue('╔═══════════════════════════════════════╗')}
${chalk.bold.blue('║')}         ${chalk.bold.white('🌟 LifeSync CLI 🌟')}         ${chalk.bold.blue('║')}
${chalk.bold.blue('║')}     ${chalk.gray('Personal Productivity Suite')}     ${chalk.bold.blue('║')}
${chalk.bold.blue('╚═══════════════════════════════════════╝')}
`;

program
  .name('lifesync')
  .description('Command-line interface for LifeSync personal productivity suite')
  .version('1.0.0')
  .hook('preAction', async () => {
    // Initialize configuration and data manager
    await ensureConfigExists();
    await dataManager.init();
  });

// Add custom help
program.addHelpText('before', logo);

// Quick commands for common actions
program
  .command('quick')
  .alias('q')
  .description('Quick actions')
  .action(async () => {
    const inquirer = (await import('inquirer')).default;
    
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '✅ Add task/todo', value: 'task' },
          { name: '🛒 Add item to shopping list', value: 'shopping' },
          { name: '🍽️ Add meal to weekly plan', value: 'meal' },
          { name: '📖 Add new recipe', value: 'recipe' },
          { name: '📋 View today\'s tasks', value: 'today' },
          { name: '📅 View this week\'s meals', value: 'week' },
          { name: '🛍️ View shopping list', value: 'list' },
          { name: '⚙️ Configure settings', value: 'config' }
        ]
      }
    ]);

    switch (answer.action) {
      case 'task':
        await import('./commands/tasks.js').then(m => 
          m.createTasksCommand().parse(['add'], { from: 'user' })
        );
        break;
      case 'shopping':
        await import('./commands/shopping.js').then(m => 
          m.createShoppingCommand().parse(['add'], { from: 'user' })
        );
        break;
      case 'today':
        await import('./commands/tasks.js').then(m => 
          m.createTasksCommand().parse(['today'], { from: 'user' })
        );
        break;
      case 'meal':
        await import('./commands/meals.js').then(m => 
          m.createMealsCommand().parse(['add'], { from: 'user' })
        );
        break;
      case 'recipe':
        await import('./commands/recipes.js').then(m => 
          m.createRecipesCommand().parse(['add'], { from: 'user' })
        );
        break;
      case 'week':
        await import('./commands/meals.js').then(m => 
          m.createMealsCommand().parse(['week'], { from: 'user' })
        );
        break;
      case 'list':
        await import('./commands/shopping.js').then(m => 
          m.createShoppingCommand().parse(['list'], { from: 'user' })
        );
        break;
      case 'config':
        await import('./commands/config.js').then(m => 
          m.createConfigCommand().parse(['setup'], { from: 'user' })
        );
        break;
    }
  });

// Shortcuts for very common actions
program
  .command('add')
  .alias('a')
  .description('Quick add (task by default)')
  .argument('[item]', 'Item to add')
  .option('-t, --task', 'Add task (default)')
  .option('-s, --shopping', 'Add shopping item instead')
  .option('-m, --meal', 'Add meal instead')
  .option('-r, --recipe', 'Add recipe instead')
  .action(async (item, options) => {
    if (options.shopping) {
      const shoppingCmd = createShoppingCommand();
      await shoppingCmd.parse(['add', ...(item ? [item] : [])], { from: 'user' });
    } else if (options.meal) {
      const mealsCmd = createMealsCommand();
      await mealsCmd.parse(['add', ...(item ? [item] : [])], { from: 'user' });
    } else if (options.recipe) {
      const recipesCmd = createRecipesCommand();
      await recipesCmd.parse(['add', ...(item ? [item] : [])], { from: 'user' });
    } else {
      // Default to tasks
      const tasksCmd = createTasksCommand();
      await tasksCmd.parse(['add', ...(item ? [item] : [])], { from: 'user' });
    }
  });

program
  .command('list')
  .alias('ls')
  .description('Quick list (tasks by default)')
  .option('-t, --tasks', 'List tasks (default)')
  .option('-s, --shopping', 'List shopping items instead')
  .option('-m, --meals', 'List meals instead')
  .option('-r, --recipes', 'List recipes instead')
  .action(async (options) => {
    if (options.shopping) {
      const shoppingCmd = createShoppingCommand();
      await shoppingCmd.parse(['list'], { from: 'user' });
    } else if (options.meals) {
      const mealsCmd = createMealsCommand();
      await mealsCmd.parse(['week'], { from: 'user' });
    } else if (options.recipes) {
      const recipesCmd = createRecipesCommand();
      await recipesCmd.parse(['list'], { from: 'user' });
    } else {
      // Default to tasks
      const tasksCmd = createTasksCommand();
      await tasksCmd.parse(['list'], { from: 'user' });
    }
  });

// Status overview command
program
  .command('status')
  .alias('overview')
  .description('Show overview of all data')
  .action(async () => {
    const ora = (await import('ora')).default;
    const spinner = ora('Loading overview...').start();

    try {
      const [shoppingItems, recipes, mealPlans, todoItems] = await Promise.all([
        dataManager.getShoppingItems(),
        dataManager.getRecipes(),
        dataManager.getMealPlans(),
        dataManager.getTodoItems()
      ]);

      const pendingItems = shoppingItems.filter(item => !item.purchased);
      const totalCost = pendingItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
      const thisWeekMeals = mealPlans.filter(meal => {
        const mealDate = new Date(meal.date);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return mealDate >= weekStart && mealDate <= weekEnd;
      });

      const pendingTasks = todoItems.filter(task => task.status !== 'done');
      const todaysTasks = todoItems.filter(task => {
        if (!task.dueDate) return false;
        const today = new Date();
        return format(new Date(task.dueDate), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      });
      const overdueTasks = todoItems.filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < new Date() && 
        task.status !== 'done'
      );

      spinner.succeed('Overview loaded');

      console.log(chalk.bold.blue('\n📊 LifeSync Overview'));
      console.log(chalk.bold('\n✅ Tasks:'));
      console.log(`  • ${pendingTasks.length} pending tasks`);
      console.log(`  • ${todaysTasks.length} due today`);
      if (overdueTasks.length > 0) {
        console.log(`  • ${chalk.red(overdueTasks.length + ' overdue')}`);
      }
      
      console.log(chalk.bold('\n🛒 Shopping:'));
      console.log(`  • ${pendingItems.length} items pending`);
      console.log(`  • $${totalCost.toFixed(2)} estimated cost`);
      
      console.log(chalk.bold('\n🍽️ Meals:'));
      console.log(`  • ${thisWeekMeals.length} meals planned this week`);
      console.log(`  • ${mealPlans.length} total meals in history`);
      
      console.log(chalk.bold('\n📖 Recipes:'));
      console.log(`  • ${recipes.length} recipes saved`);
      
      if (overdueTasks.length > 0) {
        console.log(chalk.bold.red('\n⚠️ Overdue Tasks:'));
        overdueTasks.slice(0, 3).forEach(task => {
          console.log(`  • ${chalk.red(task.title)}`);
        });
      }

      if (todaysTasks.length > 0) {
        console.log(chalk.bold('\n📅 Due Today:'));
        todaysTasks.slice(0, 3).forEach(task => {
          const statusIcon = task.status === 'currently-working' ? '🔄' : '○';
          console.log(`  ${statusIcon} ${task.title}`);
        });
      }

      if (pendingItems.length > 0) {
        console.log(chalk.bold('\n🔥 Priority Items:'));
        const highPriority = pendingItems.filter(item => item.priority === 'high').slice(0, 3);
        highPriority.forEach(item => {
          console.log(`  • ${chalk.red('HIGH')} ${item.name} (${item.quantity} ${item.unit})`);
        });
      }

      if (thisWeekMeals.length > 0) {
        console.log(chalk.bold('\n📅 This Week:'));
        thisWeekMeals.slice(0, 3).forEach(meal => {
          const date = new Date(meal.date).toLocaleDateString('en-US', { weekday: 'short' });
          const mealName = meal.customMeal || 'Recipe';
          console.log(`  • ${date} ${meal.mealType}: ${mealName}`);
        });
      }

    } catch (error) {
      spinner.fail('Failed to load overview');
      console.error(error);
    }
  });

// Add command modules
program.addCommand(createTasksCommand());
program.addCommand(createShoppingCommand());
program.addCommand(createMealsCommand());
program.addCommand(createRecipesCommand());
program.addCommand(createConfigCommand());
program.addCommand(createSyncCommand());

// Enhanced help
program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('lifesync quick')}              - Interactive quick actions
  ${chalk.cyan('lifesync add "finish report"')} - Add task (default)
  ${chalk.cyan('lifesync add -s bananas')}     - Add to shopping list
  ${chalk.cyan('lifesync add -m pasta')}       - Add pasta meal to plan
  ${chalk.cyan('lifesync list')}               - Show tasks (default)
  ${chalk.cyan('lifesync list -s')}            - Show shopping list
  ${chalk.cyan('lifesync list -m')}            - Show meal plan
  ${chalk.cyan('lifesync tasks today')}        - Show today's tasks
  ${chalk.cyan('lifesync tasks done "report"')} - Mark task as completed
  ${chalk.cyan('lifesync status')}             - Overview of all data
  ${chalk.cyan('lifesync sync all')}           - Sync all data with web app

${chalk.bold('Quick Setup:')}
  ${chalk.cyan('lifesync config setup')}       - Run initial configuration

${chalk.gray('For more help on specific commands, use:')}
  ${chalk.cyan('lifesync <command> --help')}
`);

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}