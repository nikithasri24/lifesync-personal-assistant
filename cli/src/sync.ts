import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';
import { dataManager } from './data.js';
import { loadConfig } from './config.js';
import { ShoppingItem, Recipe, MealPlan } from './types.js';

export class WebAppSync {
  private config: any;
  private baseUrl: string;

  constructor() {
    this.config = null;
    this.baseUrl = '';
  }

  async init() {
    this.config = await loadConfig();
    this.baseUrl = this.config.apiUrl || 'http://localhost:3000';
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    try {
      const url = `${this.baseUrl}/api${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error('Web app is not running. Start the web app first.');
      }
      throw error;
    }
  }

  // Shopping Items Sync
  async syncShoppingItems(direction: 'push' | 'pull' | 'both' = 'both') {
    const spinner = ora('Syncing shopping items...').start();

    try {
      if (direction === 'pull' || direction === 'both') {
        spinner.text = 'Pulling shopping items from web app...';
        const webItems = await this.makeRequest('/shopping');
        
        // Update local data
        for (const webItem of (webItems as ShoppingItem[])) {
          const localItems = await dataManager.getShoppingItems();
          const existingItem = localItems.find(item => item.id === webItem.id);
          
          if (!existingItem) {
            await dataManager.addShoppingItem(webItem);
          } else if (new Date(webItem.updatedAt) > new Date(existingItem.updatedAt)) {
            await dataManager.updateShoppingItem(webItem.id, webItem);
          }
        }
      }

      if (direction === 'push' || direction === 'both') {
        spinner.text = 'Pushing shopping items to web app...';
        const localItems = await dataManager.getShoppingItems();
        
        for (const localItem of localItems) {
          try {
            await this.makeRequest('/shopping', {
              method: 'POST',
              body: JSON.stringify(localItem)
            });
          } catch (error) {
            // Item might already exist, try updating
            try {
              await this.makeRequest(`/shopping/${localItem.id}`, {
                method: 'PUT',
                body: JSON.stringify(localItem)
              });
            } catch (updateError) {
              console.warn(`Failed to sync item ${localItem.name}:`, updateError);
            }
          }
        }
      }

      spinner.succeed(chalk.green('Shopping items synced successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to sync shopping items'));
      throw error;
    }
  }

  // Recipes Sync
  async syncRecipes(direction: 'push' | 'pull' | 'both' = 'both') {
    const spinner = ora('Syncing recipes...').start();

    try {
      if (direction === 'pull' || direction === 'both') {
        spinner.text = 'Pulling recipes from web app...';
        const webRecipes = await this.makeRequest('/recipes');
        
        for (const webRecipe of (webRecipes as Recipe[])) {
          const localRecipes = await dataManager.getRecipes();
          const existingRecipe = localRecipes.find(recipe => recipe.id === webRecipe.id);
          
          if (!existingRecipe) {
            await dataManager.addRecipe(webRecipe);
          } else if (new Date(webRecipe.createdAt) > new Date(existingRecipe.createdAt)) {
            await dataManager.updateRecipe(webRecipe.id, webRecipe);
          }
        }
      }

      if (direction === 'push' || direction === 'both') {
        spinner.text = 'Pushing recipes to web app...';
        const localRecipes = await dataManager.getRecipes();
        
        for (const localRecipe of localRecipes) {
          try {
            await this.makeRequest('/recipes', {
              method: 'POST',
              body: JSON.stringify(localRecipe)
            });
          } catch (error) {
            try {
              await this.makeRequest(`/recipes/${localRecipe.id}`, {
                method: 'PUT',
                body: JSON.stringify(localRecipe)
              });
            } catch (updateError) {
              console.warn(`Failed to sync recipe ${localRecipe.name}:`, updateError);
            }
          }
        }
      }

      spinner.succeed(chalk.green('Recipes synced successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to sync recipes'));
      throw error;
    }
  }

  // Meal Plans Sync
  async syncMealPlans(direction: 'push' | 'pull' | 'both' = 'both') {
    const spinner = ora('Syncing meal plans...').start();

    try {
      if (direction === 'pull' || direction === 'both') {
        spinner.text = 'Pulling meal plans from web app...';
        const webMeals = await this.makeRequest('/meals');
        
        for (const webMeal of (webMeals as MealPlan[])) {
          const localMeals = await dataManager.getMealPlans();
          const existingMeal = localMeals.find(meal => meal.id === webMeal.id);
          
          if (!existingMeal) {
            await dataManager.addMealPlan(webMeal);
          }
        }
      }

      if (direction === 'push' || direction === 'both') {
        spinner.text = 'Pushing meal plans to web app...';
        const localMeals = await dataManager.getMealPlans();
        
        for (const localMeal of localMeals) {
          try {
            await this.makeRequest('/meals', {
              method: 'POST',
              body: JSON.stringify(localMeal)
            });
          } catch (error) {
            try {
              await this.makeRequest(`/meals/${localMeal.id}`, {
                method: 'PUT',
                body: JSON.stringify(localMeal)
              });
            } catch (updateError) {
              console.warn(`Failed to sync meal plan:`, updateError);
            }
          }
        }
      }

      spinner.succeed(chalk.green('Meal plans synced successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to sync meal plans'));
      throw error;
    }
  }

  // Full sync
  async syncAll(direction: 'push' | 'pull' | 'both' = 'both') {
    const spinner = ora('Starting full sync...').start();

    try {
      spinner.text = 'Checking web app connection...';
      await this.makeRequest('/health');
      
      await this.syncShoppingItems(direction);
      await this.syncRecipes(direction);
      await this.syncMealPlans(direction);

      spinner.succeed(chalk.green('Full sync completed successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Sync failed'));
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    }
  }

  // Export data for manual sync
  async exportData() {
    const spinner = ora('Exporting data...').start();

    try {
      const [shoppingItems, recipes, mealPlans] = await Promise.all([
        dataManager.getShoppingItems(),
        dataManager.getRecipes(),
        dataManager.getMealPlans()
      ]);

      const exportData = {
        shoppingItems,
        recipes,
        mealPlans,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      const fs = await import('fs-extra');
      const path = await import('path');
      const exportPath = path.join(this.config.dataPath, 'export.json');
      
      await fs.writeJson(exportPath, exportData, { spaces: 2 });

      spinner.succeed(chalk.green(`Data exported to ${exportPath}`));
      return exportPath;
    } catch (error) {
      spinner.fail(chalk.red('Export failed'));
      throw error;
    }
  }

  // Import data from file
  async importData(filePath: string) {
    const spinner = ora('Importing data...').start();

    try {
      const fs = await import('fs-extra');
      
      if (!(await fs.pathExists(filePath))) {
        throw new Error('Import file not found');
      }

      const importData = await fs.readJson(filePath);
      
      if (!importData.version) {
        throw new Error('Invalid import file format');
      }

      // Import shopping items
      if (importData.shoppingItems) {
        for (const item of importData.shoppingItems) {
          try {
            await dataManager.addShoppingItem(item);
          } catch (error) {
            // Item might already exist
          }
        }
      }

      // Import recipes
      if (importData.recipes) {
        for (const recipe of importData.recipes) {
          try {
            await dataManager.addRecipe(recipe);
          } catch (error) {
            // Recipe might already exist
          }
        }
      }

      // Import meal plans
      if (importData.mealPlans) {
        for (const meal of importData.mealPlans) {
          try {
            await dataManager.addMealPlan(meal);
          } catch (error) {
            // Meal might already exist
          }
        }
      }

      spinner.succeed(chalk.green('Data imported successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Import failed'));
      throw error;
    }
  }
}

export const webAppSync = new WebAppSync();