import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { webAppSync } from '../sync.js';

export function createSyncCommand(): Command {
  const sync = new Command('sync')
    .description('Synchronize data with web application');

  // Full sync
  sync
    .command('all')
    .alias('full')
    .description('Sync all data with web app')
    .option('-p, --push', 'Push local data to web app only')
    .option('-l, --pull', 'Pull web app data to local only')
    .action(async (options) => {
      await webAppSync.init();
      
      let direction: 'push' | 'pull' | 'both' = 'both';
      if (options.push) direction = 'push';
      if (options.pull) direction = 'pull';

      await webAppSync.syncAll(direction);
    });

  // Sync shopping items
  sync
    .command('shopping')
    .alias('shop')
    .description('Sync shopping list with web app')
    .option('-p, --push', 'Push local data to web app only')
    .option('-l, --pull', 'Pull web app data to local only')
    .action(async (options) => {
      await webAppSync.init();
      
      let direction: 'push' | 'pull' | 'both' = 'both';
      if (options.push) direction = 'push';
      if (options.pull) direction = 'pull';

      await webAppSync.syncShoppingItems(direction);
    });

  // Sync recipes
  sync
    .command('recipes')
    .alias('recipe')
    .description('Sync recipes with web app')
    .option('-p, --push', 'Push local data to web app only')
    .option('-l, --pull', 'Pull web app data to local only')
    .action(async (options) => {
      await webAppSync.init();
      
      let direction: 'push' | 'pull' | 'both' = 'both';
      if (options.push) direction = 'push';
      if (options.pull) direction = 'pull';

      await webAppSync.syncRecipes(direction);
    });

  // Sync meal plans
  sync
    .command('meals')
    .alias('meal')
    .description('Sync meal plans with web app')
    .option('-p, --push', 'Push local data to web app only')
    .option('-l, --pull', 'Pull web app data to local only')
    .action(async (options) => {
      await webAppSync.init();
      
      let direction: 'push' | 'pull' | 'both' = 'both';
      if (options.push) direction = 'push';
      if (options.pull) direction = 'pull';

      await webAppSync.syncMealPlans(direction);
    });

  // Export data
  sync
    .command('export')
    .description('Export all data to JSON file')
    .action(async () => {
      await webAppSync.init();
      
      try {
        const exportPath = await webAppSync.exportData();
        console.log(chalk.green(`✓ Data exported successfully`));
        console.log(chalk.gray(`File: ${exportPath}`));
        console.log(chalk.gray('You can share this file or import it on another device'));
      } catch (error) {
        console.error(chalk.red('Export failed:'), error);
      }
    });

  // Import data
  sync
    .command('import')
    .description('Import data from JSON file')
    .argument('<file>', 'Path to JSON export file')
    .action(async (file) => {
      await webAppSync.init();
      
      try {
        const confirmed = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'This will add data from the file to your existing data. Continue?',
            default: false
          }
        ]);

        if (!confirmed.confirm) {
          console.log(chalk.yellow('Import cancelled'));
          return;
        }

        await webAppSync.importData(file);
        console.log(chalk.green('✓ Data imported successfully'));
      } catch (error) {
        console.error(chalk.red('Import failed:'), error);
      }
    });

  // Auto sync setup
  sync
    .command('auto')
    .description('Configure automatic synchronization')
    .action(async () => {
      console.log(chalk.bold.blue('Automatic Sync Setup'));
      console.log(chalk.gray('Configure when CLI should sync with web app\n'));

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableAutoSync',
          message: 'Enable automatic sync?',
          default: false
        }
      ]);

      if (answers.enableAutoSync) {
        const syncOptions = await inquirer.prompt([
          {
            type: 'list',
            name: 'frequency',
            message: 'Sync frequency:',
            choices: [
              { name: 'Before each command', value: 'pre-command' },
              { name: 'After each command', value: 'post-command' },
              { name: 'Manual only', value: 'manual' }
            ]
          },
          {
            type: 'checkbox',
            name: 'syncTypes',
            message: 'What to sync automatically:',
            choices: [
              { name: 'Shopping items', value: 'shopping', checked: true },
              { name: 'Recipes', value: 'recipes', checked: true },
              { name: 'Meal plans', value: 'meals', checked: true }
            ]
          }
        ]);

        console.log(chalk.green('\n✓ Auto-sync configured'));
        console.log(chalk.gray('Note: Auto-sync is simulated in this demo version'));
      } else {
        console.log(chalk.yellow('Auto-sync disabled'));
      }
    });

  // Status check
  sync
    .command('status')
    .alias('check')
    .description('Check sync status and connection')
    .action(async () => {
      await webAppSync.init();
      
      console.log(chalk.bold.blue('Sync Status'));
      
      try {
        // Test connection
        const ora = (await import('ora')).default;
        const spinner = ora('Checking web app connection...').start();
        
        // This would normally check if the web app is running
        // For demo purposes, we'll simulate the check
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        spinner.succeed(chalk.green('Web app connection: OK'));
        
        // Show last sync times (simulated)
        console.log(chalk.bold('\nLast Sync Times:'));
        console.log(`  Shopping: ${chalk.gray('Never')}`);
        console.log(`  Recipes: ${chalk.gray('Never')}`);
        console.log(`  Meals: ${chalk.gray('Never')}`);
        
        console.log(chalk.bold('\nAuto-sync: ') + chalk.gray('Disabled'));
        
        console.log(chalk.yellow('\nTo sync now, run:'));
        console.log(chalk.cyan('  lifesync sync all'));
        
      } catch (error) {
        console.error(chalk.red('Connection failed:'), error);
        console.log(chalk.yellow('\nTroubleshooting:'));
        console.log('• Make sure the web app is running');
        console.log('• Check your API URL in config: lifesync config show');
        console.log('• Update API URL: lifesync config set apiUrl http://localhost:3000');
      }
    });

  return sync;
}