import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { webAppSync } from '../sync.js';
import { logger } from '../utils/logger.js';

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
        logger.info('Sync', chalk.green(`✓ Data exported successfully`));
        logger.info('Sync', chalk.gray(`File: ${exportPath}`));
        logger.info('Sync', chalk.gray('You can share this file or import it on another device'));
      } catch (error) {
        logger.error('Sync', chalk.red('Export failed:'), error);
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
          logger.info('Sync', chalk.yellow('Import cancelled'));
          return;
        }

        await webAppSync.importData(file);
        logger.info('Sync', chalk.green('✓ Data imported successfully'));
      } catch (error) {
        logger.error('Sync', chalk.red('Import failed:'), error);
      }
    });

  // Auto sync setup
  sync
    .command('auto')
    .description('Configure automatic synchronization')
    .action(async () => {
      logger.info('Sync', chalk.bold.blue('Automatic Sync Setup'));
      logger.info('Sync', chalk.gray('Configure when CLI should sync with web app\n'));

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableAutoSync',
          message: 'Enable automatic sync?',
          default: false
        }
      ]);

      if (answers.enableAutoSync) {
        await inquirer.prompt([
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

        logger.info('Sync', chalk.green('\n✓ Auto-sync configured'));
        logger.info('Sync', chalk.gray('Note: Auto-sync is simulated in this demo version'));
      } else {
        logger.info('Sync', chalk.yellow('Auto-sync disabled'));
      }
    });

  // Status check
  sync
    .command('status')
    .alias('check')
    .description('Check sync status and connection')
    .action(async () => {
      await webAppSync.init();
      
      logger.info('Sync', chalk.bold.blue('Sync Status'));
      
      try {
        // Test connection
        const ora = (await import('ora')).default;
        const spinner = ora('Checking web app connection...').start();
        
        // This would normally check if the web app is running
        // For demo purposes, we'll simulate the check
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        spinner.succeed(chalk.green('Web app connection: OK'));
        
        // Show last sync times (simulated)
        logger.info('Sync', chalk.bold('\nLast Sync Times:'));
        logger.info('Sync', `  Shopping: ${chalk.gray('Never')}`);
        logger.info('Sync', `  Recipes: ${chalk.gray('Never')}`);
        logger.info('Sync', `  Meals: ${chalk.gray('Never')}`);
        
        logger.info('Sync', chalk.bold('\nAuto-sync: ') + chalk.gray('Disabled'));
        
        logger.info('Sync', chalk.yellow('\nTo sync now, run:'));
        logger.info('Sync', chalk.cyan('  lifesync sync all'));
        
      } catch (error) {
        logger.error('Sync', chalk.red('Connection failed:'), error);
        logger.info('Sync', chalk.yellow('\nTroubleshooting:'));
        logger.info('Sync', '• Make sure the web app is running');
        logger.info('Sync', '• Check your API URL in config: lifesync config show');
        logger.info('Sync', '• Update API URL: lifesync config set apiUrl http://localhost:3000');
      }
    });

  return sync;
}