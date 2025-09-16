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
        
        console.log(chalk.bold.blue('Current Configuration:'));
        console.log(`  API URL: ${chalk.green(currentConfig.apiUrl)}`);
        console.log(`  Data Path: ${chalk.green(currentConfig.dataPath)}`);
        console.log(`  Username: ${chalk.green(currentConfig.username)}`);
        console.log(`  Default Store: ${chalk.green(currentConfig.defaultStore || 'Not set')}`);
        console.log(`  Default Meal Type: ${chalk.green(currentConfig.defaultMealType)}`);
        console.log(`  Default Category: ${chalk.green(currentConfig.defaultCategory)}`);
        
      } catch (error) {
        console.error(chalk.red('Failed to load configuration'), error);
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
        console.log(chalk.green(`Set ${key} = ${newValue}`));
        
      } catch (error) {
        console.error(chalk.red('Failed to update configuration'), error);
      }
    });

  // Setup wizard
  config
    .command('setup')
    .alias('init')
    .description('Run initial setup wizard')
    .action(async () => {
      console.log(chalk.bold.blue('LifeSync CLI Setup'));
      console.log(chalk.gray('Configure your CLI preferences\n'));

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
        
        console.log(chalk.green('\n✓ Setup completed successfully!'));
        console.log(chalk.gray('You can now use LifeSync CLI commands.'));
        console.log(chalk.gray('Run "lifesync --help" to see available commands.'));
        
      } catch (error) {
        console.error(chalk.red('Setup failed'), error);
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
          console.log(chalk.yellow('Cancelled'));
          return;
        }

        const { DEFAULT_CONFIG } = await import('../config.js');
        await saveConfig(DEFAULT_CONFIG);
        
        console.log(chalk.green('Configuration reset to defaults'));
        
      } catch (error) {
        console.error(chalk.red('Failed to reset configuration'), error);
      }
    });

  return config;
}