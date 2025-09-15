import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { dataManager } from '../data.js';
import { ShoppingItem } from '../types.js';
import { loadConfig } from '../config.js';

export function createShoppingCommand(): Command {
  const shopping = new Command('shopping')
    .alias('shop')
    .description('Manage shopping list items');

  // Add item to shopping list
  shopping
    .command('add')
    .alias('a')
    .description('Add item to shopping list')
    .argument('[name]', 'Item name')
    .option('-q, --quantity <number>', 'Quantity', '1')
    .option('-u, --unit <string>', 'Unit (pcs, lbs, oz, etc.)', 'pcs')
    .option('-c, --category <string>', 'Category')
    .option('-p, --priority <string>', 'Priority (low, medium, high)', 'medium')
    .option('--price <number>', 'Estimated price')
    .option('--store <string>', 'Preferred store')
    .option('--brand <string>', 'Brand')
    .option('--notes <string>', 'Notes')
    .option('--organic', 'Mark as organic')
    .option('--barcode <string>', 'Barcode')
    .action(async (name, options) => {
      await dataManager.init();
      const config = await loadConfig();

      let itemName = name;
      let quantity = parseInt(options.quantity) || 1;
      let unit = options.unit || 'pcs';
      let category = options.category || config.defaultCategory || 'other';
      let priority = options.priority || 'medium';

      // Interactive mode if no name provided
      if (!itemName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Item name:',
            validate: (input) => input.trim() !== '' || 'Item name is required'
          },
          {
            type: 'number',
            name: 'quantity',
            message: 'Quantity:',
            default: 1
          },
          {
            type: 'list',
            name: 'unit',
            message: 'Unit:',
            choices: ['pcs', 'lbs', 'oz', 'bottles', 'cartons', 'boxes', 'bags'],
            default: 'pcs'
          },
          {
            type: 'list',
            name: 'category',
            message: 'Category:',
            choices: [
              'produce', 'dairy', 'meat', 'pantry', 'frozen', 
              'bakery', 'deli', 'household', 'personal', 'electronics', 'other'
            ],
            default: category
          },
          {
            type: 'list',
            name: 'priority',
            message: 'Priority:',
            choices: ['low', 'medium', 'high'],
            default: 'medium'
          },
          {
            type: 'input',
            name: 'price',
            message: 'Estimated price (optional):',
            filter: (input) => input ? parseFloat(input) : undefined
          },
          {
            type: 'input',
            name: 'brand',
            message: 'Brand (optional):'
          },
          {
            type: 'input',
            name: 'notes',
            message: 'Notes (optional):'
          },
          {
            type: 'confirm',
            name: 'organic',
            message: 'Is this organic?',
            default: false
          }
        ]);

        itemName = answers.name;
        quantity = answers.quantity;
        unit = answers.unit;
        category = answers.category;
        priority = answers.priority;
        options.price = answers.price;
        options.brand = answers.brand;
        options.notes = answers.notes;
        options.organic = answers.organic;
      }

      const spinner = ora('Adding item to shopping list...').start();

      try {
        const item = await dataManager.addShoppingItem({
          name: itemName,
          quantity,
          unit,
          category,
          priority,
          purchased: false,
          estimatedPrice: options.price ? parseFloat(options.price) : undefined,
          assignedStore: options.store,
          brand: options.brand,
          notes: options.notes,
          barcode: options.barcode,
          nutritionInfo: options.organic ? { organic: true } : undefined,
          addedBy: config.username || 'cli'
        });

        spinner.succeed(chalk.green(`Added "${item.name}" to shopping list`));
        console.log(chalk.gray(`  ${item.quantity} ${item.unit} | ${item.category} | ${item.priority} priority`));
        if (item.estimatedPrice) console.log(chalk.gray(`  Est. price: $${item.estimatedPrice.toFixed(2)}`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to add item'));
        console.error(error);
      }
    });

  // List shopping items
  shopping
    .command('list')
    .alias('ls')
    .description('List shopping items')
    .option('-a, --all', 'Show all items including purchased')
    .option('-c, --category <string>', 'Filter by category')
    .option('-s, --store <string>', 'Filter by assigned store')
    .option('-p, --priority <string>', 'Filter by priority')
    .action(async (options) => {
      await dataManager.init();

      const spinner = ora('Loading shopping list...').start();

      try {
        const items = await dataManager.getShoppingItems();
        let filteredItems = items;

        if (!options.all) {
          filteredItems = filteredItems.filter(item => !item.purchased);
        }

        if (options.category) {
          filteredItems = filteredItems.filter(item => item.category === options.category);
        }

        if (options.store) {
          filteredItems = filteredItems.filter(item => item.assignedStore === options.store);
        }

        if (options.priority) {
          filteredItems = filteredItems.filter(item => item.priority === options.priority);
        }

        spinner.succeed(chalk.green(`Found ${filteredItems.length} items`));

        if (filteredItems.length === 0) {
          console.log(chalk.yellow('No items found'));
          return;
        }

        // Group by category
        const grouped = filteredItems.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, ShoppingItem[]>);

        Object.entries(grouped).forEach(([category, categoryItems]) => {
          console.log(`\n${chalk.bold.blue(category.toUpperCase())}`);
          categoryItems.forEach(item => {
            const priorityColor = item.priority === 'high' ? chalk.red :
                                 item.priority === 'medium' ? chalk.yellow : chalk.gray;
            const status = item.purchased ? chalk.green('✓') : chalk.gray('○');
            
            console.log(`  ${status} ${chalk.white(item.name)} (${item.quantity} ${item.unit})`);
            if (item.estimatedPrice) console.log(`    ${chalk.gray('$' + item.estimatedPrice.toFixed(2))}`);
            if (item.assignedStore) console.log(`    ${chalk.blue(item.assignedStore)}`);
            if (item.brand) console.log(`    ${chalk.gray(item.brand)}`);
            if (item.priority !== 'medium') console.log(`    ${priorityColor(item.priority)}`);
          });
        });

        const totalCost = filteredItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
        if (totalCost > 0) {
          console.log(`\n${chalk.bold.green('Total estimated cost: $' + totalCost.toFixed(2))}`);
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to load shopping list'));
        console.error(error);
      }
    });

  // Mark item as purchased
  shopping
    .command('buy')
    .alias('check')
    .description('Mark item as purchased')
    .argument('<query>', 'Item name or ID to mark as purchased')
    .option('--price <number>', 'Actual price paid')
    .action(async (query, options) => {
      await dataManager.init();

      const spinner = ora('Updating item...').start();

      try {
        const items = await dataManager.getShoppingItems();
        const item = items.find(i => 
          i.id === query || 
          i.name.toLowerCase().includes(query.toLowerCase())
        );

        if (!item) {
          spinner.fail(chalk.red('Item not found'));
          return;
        }

        const updates: Partial<ShoppingItem> = {
          purchased: true,
          purchasedAt: new Date(),
          purchasedBy: (await loadConfig()).username || 'cli'
        };

        if (options.price) {
          updates.price = parseFloat(options.price);
        }

        await dataManager.updateShoppingItem(item.id, updates);

        spinner.succeed(chalk.green(`Marked "${item.name}" as purchased`));
        if (options.price) {
          console.log(chalk.gray(`  Actual price: $${options.price}`));
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to update item'));
        console.error(error);
      }
    });

  // Remove item
  shopping
    .command('remove')
    .alias('rm')
    .description('Remove item from shopping list')
    .argument('<query>', 'Item name or ID to remove')
    .action(async (query) => {
      await dataManager.init();

      const spinner = ora('Removing item...').start();

      try {
        const items = await dataManager.getShoppingItems();
        const item = items.find(i => 
          i.id === query || 
          i.name.toLowerCase().includes(query.toLowerCase())
        );

        if (!item) {
          spinner.fail(chalk.red('Item not found'));
          return;
        }

        const confirmed = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Remove "${item.name}" from shopping list?`,
          default: false
        }]);

        if (!confirmed.confirm) {
          spinner.info(chalk.yellow('Cancelled'));
          return;
        }

        await dataManager.deleteShoppingItem(item.id);
        spinner.succeed(chalk.green(`Removed "${item.name}" from shopping list`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to remove item'));
        console.error(error);
      }
    });

  // Clear purchased items
  shopping
    .command('clear')
    .description('Remove all purchased items')
    .action(async () => {
      await dataManager.init();

      const items = await dataManager.getShoppingItems();
      const purchasedItems = items.filter(item => item.purchased);

      if (purchasedItems.length === 0) {
        console.log(chalk.yellow('No purchased items to clear'));
        return;
      }

      const confirmed = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Remove ${purchasedItems.length} purchased items?`,
        default: false
      }]);

      if (!confirmed.confirm) {
        console.log(chalk.yellow('Cancelled'));
        return;
      }

      const spinner = ora('Clearing purchased items...').start();

      try {
        for (const item of purchasedItems) {
          await dataManager.deleteShoppingItem(item.id);
        }

        spinner.succeed(chalk.green(`Cleared ${purchasedItems.length} purchased items`));
      } catch (error) {
        spinner.fail(chalk.red('Failed to clear items'));
        console.error(error);
      }
    });

  return shopping;
}