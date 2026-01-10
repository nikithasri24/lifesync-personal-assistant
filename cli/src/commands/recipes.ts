/* eslint-disable no-console */
/* eslint-disable max-lines */
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { dataManager } from '../data.js';
import { type Recipe, type Ingredient, type Cuisine, type Difficulty, type IngredientCategory } from '../types.js';

interface RecipeAddOptions {
  cuisine?: string;
  difficulty?: string;
  prep?: string;
  cook?: string;
  servings?: string;
  url?: string;
  description?: string;
}

interface RecipeListOptions {
  cuisine?: string;
  difficulty?: string;
  tag?: string;
  quick?: boolean;
}

interface BasicAnswers {
  name: string;
  description?: string;
  cuisine: Cuisine;
  difficulty: Difficulty;
  prepTime: number;
  cookTime: number;
  servings: number;
  url?: string;
}

interface IngredientNameAnswer {
  name: string;
}

interface IngredientDetailAnswers {
  amount: number;
  unit: string;
  category: IngredientCategory;
  optional: boolean;
}

interface InstructionAnswer {
  instruction: string;
}

interface TagsAnswer {
  tags: string[];
}

interface ConfirmAnswer {
  confirm: boolean;
}

export function createRecipesCommand(): Command {
  const recipes = new Command('recipes');
  recipes.alias('recipe');
  recipes.description('Manage recipes');

  // Add recipe
  const addCommand = recipes.command('add') as Command;
  addCommand.alias('a');
  addCommand.description('Add new recipe');
  addCommand.argument('[name]', 'Recipe name');
  addCommand.option('-c, --cuisine <string>', 'Cuisine type');
  addCommand.option('-d, --difficulty <string>', 'Difficulty (easy, medium, hard)', 'medium');
  addCommand.option('--prep <number>', 'Prep time in minutes', '15');
  addCommand.option('--cook <number>', 'Cook time in minutes', '30');
  addCommand.option('-s, --servings <number>', 'Number of servings', '4');
  addCommand.option('--url <string>', 'Source URL');
  addCommand.option('--description <string>', 'Recipe description');
  addCommand.action(async (name: string | undefined, options: RecipeAddOptions) => {
      await dataManager.init();

      let recipeName = name;
      let cuisine: Cuisine = (options.cuisine ?? 'other') as Cuisine;
      let difficulty: Difficulty = (options.difficulty ?? 'medium') as Difficulty;
      let prepTime = parseInt(options.prep ?? '15') || 15;
      let cookTime = parseInt(options.cook ?? '30') || 30;
      let servings = parseInt(options.servings ?? '4') || 4;

      // Interactive mode if no name provided
      if (!recipeName) {
        const basicAnswers = await inquirer.prompt<BasicAnswers>([
          {
            type: 'input',
            name: 'name',
            message: 'Recipe name:',
            validate: (input: string) => input.trim() !== '' || 'Recipe name is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):'
          },
          {
            type: 'list',
            name: 'cuisine',
            message: 'Cuisine:',
            choices: ['american', 'italian', 'mexican', 'asian', 'indian', 'mediterranean', 'other'],
            default: 'other'
          },
          {
            type: 'list',
            name: 'difficulty',
            message: 'Difficulty:',
            choices: ['easy', 'medium', 'hard'],
            default: 'medium'
          },
          {
            type: 'number',
            name: 'prepTime',
            message: 'Prep time (minutes):',
            default: 15
          },
          {
            type: 'number',
            name: 'cookTime',
            message: 'Cook time (minutes):',
            default: 30
          },
          {
            type: 'number',
            name: 'servings',
            message: 'Number of servings:',
            default: 4
          },
          {
            type: 'input',
            name: 'url',
            message: 'Source URL (optional):'
          }
        ]);

        recipeName = basicAnswers.name;
        options.description = basicAnswers.description;
        cuisine = basicAnswers.cuisine;
        difficulty = basicAnswers.difficulty;
        prepTime = basicAnswers.prepTime;
        cookTime = basicAnswers.cookTime;
        servings = basicAnswers.servings;
        options.url = basicAnswers.url;
      }

      // Add ingredients
      console.info(chalk.blue('\nAdd ingredients (press Enter with empty name to finish):'));
      const ingredients: Ingredient[] = [];
      let addingIngredients = true;

      while (addingIngredients) {
        const ingredientAnswers = await inquirer.prompt<IngredientNameAnswer>([
          {
            type: 'input',
            name: 'name',
            message: `Ingredient ${ingredients.length + 1} name:`,
            validate: (input: string) => {
              if (input.trim() === '' && ingredients.length === 0) {
                return 'At least one ingredient is required';
              }
              return true;
            }
          }
        ]);

        if (ingredientAnswers.name.trim() === '') {
          addingIngredients = false;
          continue;
        }

        const detailAnswers = await inquirer.prompt<IngredientDetailAnswers>([
          {
            type: 'number',
            name: 'amount',
            message: 'Amount:',
            default: 1
          },
          {
            type: 'input',
            name: 'unit',
            message: 'Unit:',
            default: 'cup'
          },
          {
            type: 'list',
            name: 'category',
            message: 'Category:',
            choices: ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'deli', 'household', 'personal', 'other'],
            default: 'pantry'
          },
          {
            type: 'confirm',
            name: 'optional',
            message: 'Is this ingredient optional?',
            default: false
          }
        ]);

        ingredients.push({
          name: ingredientAnswers.name,
          amount: detailAnswers.amount,
          unit: detailAnswers.unit,
          category: detailAnswers.category,
          optional: detailAnswers.optional
        });
      }

      // Add instructions
      console.info(chalk.blue('\nAdd cooking instructions (press Enter with empty instruction to finish):'));
      const instructions: string[] = [];
      let addingInstructions = true;

      while (addingInstructions) {
        const instructionAnswer = await inquirer.prompt<InstructionAnswer>([
          {
            type: 'input',
            name: 'instruction',
            message: `Step ${instructions.length + 1}:`,
            validate: (input: string) => {
              if (input.trim() === '' && instructions.length === 0) {
                return 'At least one instruction is required';
              }
              return true;
            }
          }
        ]);

        if (instructionAnswer.instruction.trim() === '') {
          addingInstructions = false;
        } else {
          instructions.push(instructionAnswer.instruction);
        }
      }

      // Add tags
      const tagsAnswer = await inquirer.prompt<TagsAnswer>([
        {
          type: 'input',
          name: 'tags',
          message: 'Tags (comma-separated, optional):',
          filter: (input: string) => input ? input.split(',').map((tag: string) => tag.trim()) : []
        }
      ]);

      const spinner = ora('Saving recipe...').start() as Ora;

      try {
        const recipe: Omit<Recipe, 'id' | 'createdAt'> = {
          name: recipeName,
          description: options.description,
          cuisine,
          difficulty,
          prepTime,
          cookTime,
          servings,
          ingredients,
          instructions,
          tags: tagsAnswer.tags,
          dietaryRestrictions: [],
          sourceUrl: options.url,
          sourceType: options.url ? (options.url.includes('youtube') ? 'youtube' : 'manual') : 'manual'
        };

        const newRecipe = await dataManager.addRecipe(recipe);

        spinner.succeed(chalk.green(`Added recipe "${newRecipe.name}"`));
        console.info(chalk.gray(`  ${newRecipe.cuisine} • ${newRecipe.difficulty} • ${newRecipe.prepTime + newRecipe.cookTime} min • ${newRecipe.servings} servings`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to add recipe'));
        console.error(error);
      }
    });

  // List recipes
  const listCommand = recipes.command('list') as Command;
  listCommand.alias('ls');
  listCommand.description('List recipes');
  listCommand.option('-c, --cuisine <string>', 'Filter by cuisine');
  listCommand.option('-d, --difficulty <string>', 'Filter by difficulty');
  listCommand.option('-t, --tag <string>', 'Filter by tag');
  listCommand.option('--quick', 'Show only quick recipes (< 30 min total)');
  listCommand.action(async (options: RecipeListOptions) => {
      await dataManager.init();

      const spinner = ora('Loading recipes...').start() as Ora;

      try {
        let recipes = await dataManager.getRecipes();

        if (options.cuisine) {
          recipes = recipes.filter(recipe => recipe.cuisine === options.cuisine);
        }

        if (options.difficulty) {
          recipes = recipes.filter(recipe => recipe.difficulty === options.difficulty);
        }

        if (options.tag) {
          const tagFilter = options.tag.toLowerCase();
          recipes = recipes.filter(recipe =>
            recipe.tags.some(tag => tag.toLowerCase().includes(tagFilter))
          );
        }

        if (options.quick) {
          recipes = recipes.filter(recipe => (recipe.prepTime + recipe.cookTime) < 30);
        }

        spinner.succeed(chalk.green(`Found ${recipes.length} recipes`));

        if (recipes.length === 0) {
          console.info(chalk.yellow('No recipes found'));
          return;
        }

        // Group by cuisine
        const grouped = recipes.reduce((acc, recipe) => {
          if (!acc[recipe.cuisine]) acc[recipe.cuisine] = [];
          acc[recipe.cuisine].push(recipe);
          return acc;
        }, {} as Record<string, Recipe[]>);

        Object.entries(grouped).forEach(([cuisine, cuisineRecipes]) => {
          console.info(`\n${chalk.bold.blue(cuisine.toUpperCase())}`);
          cuisineRecipes.forEach(recipe => {
            const difficultyColor = recipe.difficulty === 'easy' ? chalk.green :
                                   recipe.difficulty === 'medium' ? chalk.yellow : chalk.red;
            const totalTime = recipe.prepTime + recipe.cookTime;

            console.info(`  📖 ${chalk.white(recipe.name)}`);
            console.info(`    ${difficultyColor(recipe.difficulty)} • ${totalTime} min • ${recipe.servings} servings`);
            console.info(`    ${chalk.gray(recipe.description ?? '')}`);
            console.info(`    ${chalk.cyan(recipe.tags.join(', '))}`);
            console.info(`    ${chalk.blue(recipe.sourceUrl ?? '')}`);
          });
        });

      } catch (error) {
        spinner.fail(chalk.red('Failed to load recipes'));
        console.error(error);
      }
    });

  // Show recipe details
  const showCommand = recipes.command('show') as Command;
  showCommand.alias('view');
  showCommand.description('Show recipe details');
  showCommand.argument('<query>', 'Recipe name or ID');
  showCommand.action(async (query: string) => {
      await dataManager.init();

      const spinner = ora('Loading recipe...').start() as Ora;

      try {
        const recipes = await dataManager.getRecipes();
        const recipe = recipes.find(r =>
          r.id === query ||
          r.name.toLowerCase().includes(query.toLowerCase())
        );

        if (!recipe) {
          spinner.fail(chalk.red('Recipe not found'));
          return;
        }

        spinner.succeed(chalk.green(`Recipe: ${recipe.name}`));

        console.info(`\n${chalk.bold.blue(recipe.name)}`);
        console.info(chalk.gray(recipe.description ?? ''));

        console.info(`\n${chalk.bold('Details:')}`);
        console.info(`  Cuisine: ${recipe.cuisine}`);
        console.info(`  Difficulty: ${recipe.difficulty}`);
        console.info(`  Prep time: ${recipe.prepTime} minutes`);
        console.info(`  Cook time: ${recipe.cookTime} minutes`);
        console.info(`  Total time: ${recipe.prepTime + recipe.cookTime} minutes`);
        console.info(`  Servings: ${recipe.servings}`);

        if (recipe.tags.length > 0) {
          console.info(`  Tags: ${chalk.cyan(recipe.tags.join(', '))}`);
        }

        console.info(`\n${chalk.bold('Ingredients:')}`);
        recipe.ingredients.forEach((ingredient, index) => {
          const optional = ingredient.optional ? chalk.gray(' (optional)') : '';
          console.info(`  ${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}${optional}`);
        });

        console.info(`\n${chalk.bold('Instructions:')}`);
        recipe.instructions.forEach((instruction, index) => {
          console.info(`  ${index + 1}. ${instruction}`);
        });

        if (recipe.sourceUrl) {
          console.info(`\n${chalk.bold('Source:')}`);
          console.info(`  ${chalk.blue(recipe.sourceUrl)}`);
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to load recipe'));
        console.error(error);
      }
    });

  // Import recipe from URL
  const importCommand = recipes.command('import') as Command;
  importCommand.alias('i');
  importCommand.description('Import recipe from URL');
  importCommand.argument('<url>', 'YouTube or other recipe URL');
  importCommand.action(async (url: string) => {
      await dataManager.init();

      const spinner = ora('Importing recipe from URL...').start() as Ora;

      try {
        // Mock implementation - in a real app, this would call an API
        spinner.text = 'Analyzing URL...';
        await new Promise(resolve => setTimeout(resolve, 1000));

        spinner.text = 'Extracting recipe data...';
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock recipe data
        const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
        const isInstagram = url.includes('instagram.com');

        const mockRecipe: Omit<Recipe, 'id' | 'createdAt'> = {
          name: `Imported ${isYoutube ? 'YouTube' : isInstagram ? 'Instagram' : 'Web'} Recipe`,
          description: 'Delicious recipe imported from the web',
          cuisine: 'other',
          difficulty: 'medium',
          prepTime: 20,
          cookTime: 30,
          servings: 4,
          ingredients: [
            { name: 'Main ingredient', amount: 2, unit: 'cups', category: 'pantry' },
            { name: 'Seasoning', amount: 1, unit: 'tsp', category: 'pantry' },
            { name: 'Fresh herbs', amount: 0.25, unit: 'cup', category: 'produce' }
          ],
          instructions: [
            'Prepare the main ingredient according to package directions',
            'Season with the specified seasonings',
            'Add fresh herbs and mix well',
            'Cook until heated through',
            'Serve and enjoy!'
          ],
          tags: ['imported', isYoutube ? 'youtube' : isInstagram ? 'instagram' : 'web'],
          dietaryRestrictions: [],
          sourceUrl: url,
          sourceType: isYoutube ? 'youtube' : 'manual'
        };

        const newRecipe = await dataManager.addRecipe(mockRecipe);

        spinner.succeed(chalk.green(`Imported recipe "${newRecipe.name}"`));
        console.info(chalk.gray(`  ${newRecipe.cuisine} • ${newRecipe.difficulty} • ${newRecipe.prepTime + newRecipe.cookTime} min • ${newRecipe.servings} servings`));
        console.info(chalk.blue(`  Source: ${url}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to import recipe'));
        console.error(error);
      }
    });

  // Remove recipe
  const removeCommand = recipes.command('remove') as Command;
  removeCommand.alias('rm');
  removeCommand.description('Remove recipe');
  removeCommand.argument('<query>', 'Recipe name or ID');
  removeCommand.action(async (query: string) => {
      await dataManager.init();

      const spinner = ora('Removing recipe...').start() as Ora;

      try {
        const recipes = await dataManager.getRecipes();
        const recipe = recipes.find(r =>
          r.id === query ||
          r.name.toLowerCase().includes(query.toLowerCase())
        );

        if (!recipe) {
          spinner.fail(chalk.red('Recipe not found'));
          return;
        }

        const confirmed = await inquirer.prompt<ConfirmAnswer>([{
          type: 'confirm',
          name: 'confirm',
          message: `Remove recipe "${recipe.name}"?`,
          default: false
        }]);

        if (!confirmed.confirm) {
          spinner.info(chalk.yellow('Cancelled'));
          return;
        }

        await dataManager.deleteRecipe(recipe.id);
        spinner.succeed(chalk.green(`Removed recipe "${recipe.name}"`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to remove recipe'));
        console.error(error);
      }
    });

  return recipes;
}