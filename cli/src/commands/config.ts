import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, saveConfig, updateConfig } from '../config.js';

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage CLI configuration');

  // Show current config
  config
    .command('show')
    .alias('get')
    .description('Show current configuration')
    .action(async () => {
      try {
        const currentConfig = await loadConfig();
        
        logger.info('Config', chalk.bold.blue('Current Configuration:'));
        logger.info('Config', `  API URL: ${chalk.green(currentConfig.apiUrl)}`);
        logger.info('Config', `  Data Path: ${chalk.green(currentConfig.dataPath)}`);
        logger.info('Config', `  Username: ${chalk.green(currentConfig.username)}`);
        logger.info('Config', `  Default Store: ${chalk.green(currentConfig.defaultStore || 'Not set')}`);
        logger.info('Config', `  Default Meal Type: ${chalk.green(currentConfig.defaultMealType)}`);
        logger.info('Config', `  Default Category: ${chalk.green(currentConfig.defaultCategory)}`);
        
      } catch (error) {
        logger.error('Config', chalk.red('Failed to load configuration'), error);
      }
    });

  // Set config value
  config
    .command('set')
    .description('Set configuration value')
    .argument('<key>', 'Configuration key')
    .argument('[value]', 'Configuration value')
    .action(async (key, value) => {
      try {
        let newValue = value;
        
        // Interactive mode if no value provided
        if (!newValue) {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'value',
              message: `Enter value for ${key}:`,
              validate: (input) => input.trim() !== '' || 'Value is required'
            }
          ]);
          newValue = answer.value;
        }

        await updateConfig({ [key]: newValue });
        logger.info('Config', chalk.green(`Set ${key} = ${newValue}`));
        
      } catch (error) {
        logger.error('Config', chalk.red('Failed to update configuration'), error);
      }
    });

  // Setup wizard
  config
    .command('setup')
    .alias('init')
    .description('Run initial setup wizard')
    .action(async () => {
      logger.info('Config', chalk.bold.blue('LifeSync CLI Setup'));
      logger.info('Config', chalk.gray('Configure your CLI preferences\n'));

      try {
        const currentConfig = await loadConfig();
        
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'username',
            message: 'Your name/username:',
            default: currentConfig.username
          },
          {
            type: 'input',
            name: 'apiUrl',
            message: 'API URL (if using web app sync):',
            default: currentConfig.apiUrl
          },
          {
            type: 'list',
            name: 'defaultMealType',
            message: 'Default meal type:',
            choices: ['breakfast', 'lunch', 'dinner', 'snack'],
            default: currentConfig.defaultMealType
          },
          {
            type: 'list',
            name: 'defaultCategory',
            message: 'Default shopping category:',
            choices: ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'deli', 'household', 'personal', 'other'],
            default: currentConfig.defaultCategory
          }
        ]);

        await saveConfig({ ...currentConfig, ...answers });
        
        logger.info('Config', chalk.green('\n✓ Setup completed successfully!'));
        logger.info('Config', chalk.gray('You can now use LifeSync CLI commands.'));
        logger.info('Config', chalk.gray('Run "lifesync --help" to see available commands.'));
        
      } catch (error) {
        logger.error('Config', chalk.red('Setup failed'), error);
      }
    });

  // Reset config
  config
    .command('reset')
    .description('Reset configuration to defaults')
    .action(async () => {
      try {
        const confirmed = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Reset configuration to defaults?',
            default: false
          }
        ]);

        if (!confirmed.confirm) {
          logger.info('Config', chalk.yellow('Cancelled'));
          return;
        }

        const { DEFAULT_CONFIG } = await import('../config.js');
        await saveConfig(DEFAULT_CONFIG);
        
        logger.info('Config', chalk.green('Configuration reset to defaults'));
        
      } catch (error) {
        logger.error('Config', chalk.red('Failed to reset configuration'), error);
      }
    });

  return config;
}