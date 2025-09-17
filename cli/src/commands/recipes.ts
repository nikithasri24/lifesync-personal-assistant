import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { dataManager } from '../data.js';
import { Recipe, Ingredient } from '../types.js';

export function createRecipesCommand(): Command {
  const recipes = new Command('recipes')
    .alias('recipe')
    .description('Manage recipes');

  // Add recipe
  recipes
    .command('add')
    .alias('a')
    .description('Add new recipe')
    .argument('[name]', 'Recipe name')
    .option('-c, --cuisine <string>', 'Cuisine type')
    .option('-d, --difficulty <string>', 'Difficulty (easy, medium, hard)', 'medium')
    .option('--prep <number>', 'Prep time in minutes', '15')
    .option('--cook <number>', 'Cook time in minutes', '30')
    .option('-s, --servings <number>', 'Number of servings', '4')
    .option('--url <string>', 'Source URL')
    .option('--description <string>', 'Recipe description')
    .action(async (name, options) => {
      await dataManager.init();

      let recipeName = name;
      let cuisine = options.cuisine;
      let difficulty = options.difficulty || 'medium';
      let prepTime = parseInt(options.prep) || 15;
      let cookTime = parseInt(options.cook) || 30;
      let servings = parseInt(options.servings) || 4;

      // Interactive mode if no name provided
      if (!recipeName) {
        const basicAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Recipe name:',
            validate: (input) => input.trim() !== '' || 'Recipe name is required'
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
      console.log(chalk.blue('\nAdd ingredients (press Enter with empty name to finish):'));
      const ingredients: Ingredient[] = [];
      let addingIngredients = true;

      while (addingIngredients) {
        const ingredientAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: `Ingredient ${ingredients.length + 1} name:`,
            validate: (input) => {
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

        const detailAnswers = await inquirer.prompt([
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
      console.log(chalk.blue('\nAdd cooking instructions (press Enter with empty instruction to finish):'));
      const instructions: string[] = [];
      let addingInstructions = true;

      while (addingInstructions) {
        const instructionAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'instruction',
            message: `Step ${instructions.length + 1}:`,
            validate: (input) => {
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
      const tagsAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'tags',
          message: 'Tags (comma-separated, optional):',
          filter: (input) => input ? input.split(',').map((tag: string) => tag.trim()) : []
        }
      ]);

      const spinner = ora('Saving recipe...').start();

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
        console.log(chalk.gray(`  ${newRecipe.cuisine} • ${newRecipe.difficulty} • ${newRecipe.prepTime + newRecipe.cookTime} min • ${newRecipe.servings} servings`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to add recipe'));
        console.error(error);
      }
    });

  // List recipes
  recipes
    .command('list')
    .alias('ls')
    .description('List recipes')
    .option('-c, --cuisine <string>', 'Filter by cuisine')
    .option('-d, --difficulty <string>', 'Filter by difficulty')
    .option('-t, --tag <string>', 'Filter by tag')
    .option('--quick', 'Show only quick recipes (< 30 min total)')
    .action(async (options) => {
      await dataManager.init();

      const spinner = ora('Loading recipes...').start();

      try {
        let recipes = await dataManager.getRecipes();

        if (options.cuisine) {
          recipes = recipes.filter(recipe => recipe.cuisine === options.cuisine);
        }

        if (options.difficulty) {
          recipes = recipes.filter(recipe => recipe.difficulty === options.difficulty);
        }

        if (options.tag) {
          recipes = recipes.filter(recipe => 
            recipe.tags.some(tag => tag.toLowerCase().includes(options.tag.toLowerCase()))
          );
        }

        if (options.quick) {
          recipes = recipes.filter(recipe => (recipe.prepTime + recipe.cookTime) < 30);
        }

        spinner.succeed(chalk.green(`Found ${recipes.length} recipes`));

        if (recipes.length === 0) {
          console.log(chalk.yellow('No recipes found'));
          return;
        }

        // Group by cuisine
        const grouped = recipes.reduce((acc, recipe) => {
          if (!acc[recipe.cuisine]) acc[recipe.cuisine] = [];
          acc[recipe.cuisine].push(recipe);
          return acc;
        }, {} as Record<string, Recipe[]>);

        Object.entries(grouped).forEach(([cuisine, cuisineRecipes]) => {
          console.log(`\n${chalk.bold.blue(cuisine.toUpperCase())}`);
          cuisineRecipes.forEach(recipe => {
            const difficultyColor = recipe.difficulty === 'easy' ? chalk.green :
                                   recipe.difficulty === 'medium' ? chalk.yellow : chalk.red;
            const totalTime = recipe.prepTime + recipe.cookTime;
            
            console.log(`  📖 ${chalk.white(recipe.name)}`);
            console.log(`    ${difficultyColor(recipe.difficulty)} • ${totalTime} min • ${recipe.servings} servings`);
            if (recipe.description) console.log(`    ${chalk.gray(recipe.description)}`);
            if (recipe.tags.length > 0) console.log(`    ${chalk.cyan(recipe.tags.join(', '))}`);
            if (recipe.sourceUrl) console.log(`    ${chalk.blue(recipe.sourceUrl)}`);
          });
        });

      } catch (error) {
        spinner.fail(chalk.red('Failed to load recipes'));
        console.error(error);
      }
    });

  // Show recipe details
  recipes
    .command('show')
    .alias('view')
    .description('Show recipe details')
    .argument('<query>', 'Recipe name or ID')
    .action(async (query) => {
      await dataManager.init();

      const spinner = ora('Loading recipe...').start();

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

        console.log(`\n${chalk.bold.blue(recipe.name)}`);
        if (recipe.description) console.log(chalk.gray(recipe.description));
        
        console.log(`\n${chalk.bold('Details:')}`);
        console.log(`  Cuisine: ${recipe.cuisine}`);
        console.log(`  Difficulty: ${recipe.difficulty}`);
        console.log(`  Prep time: ${recipe.prepTime} minutes`);
        console.log(`  Cook time: ${recipe.cookTime} minutes`);
        console.log(`  Total time: ${recipe.prepTime + recipe.cookTime} minutes`);
        console.log(`  Servings: ${recipe.servings}`);
        
        if (recipe.tags.length > 0) {
          console.log(`  Tags: ${chalk.cyan(recipe.tags.join(', '))}`);
        }

        console.log(`\n${chalk.bold('Ingredients:')}`);
        recipe.ingredients.forEach((ingredient, index) => {
          const optional = ingredient.optional ? chalk.gray(' (optional)') : '';
          console.log(`  ${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}${optional}`);
        });

        console.log(`\n${chalk.bold('Instructions:')}`);
        recipe.instructions.forEach((instruction, index) => {
          console.log(`  ${index + 1}. ${instruction}`);
        });

        if (recipe.sourceUrl) {
          console.log(`\n${chalk.bold('Source:')}`);
          console.log(`  ${chalk.blue(recipe.sourceUrl)}`);
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to load recipe'));
        console.error(error);
      }
    });

  // Import recipe from URL
  recipes
    .command('import')
    .alias('i')
    .description('Import recipe from URL')
    .argument('<url>', 'YouTube or other recipe URL')
    .action(async (url) => {
      await dataManager.init();

      const spinner = ora('Importing recipe from URL...').start();

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
        console.log(chalk.gray(`  ${newRecipe.cuisine} • ${newRecipe.difficulty} • ${newRecipe.prepTime + newRecipe.cookTime} min • ${newRecipe.servings} servings`));
        console.log(chalk.blue(`  Source: ${url}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to import recipe'));
        console.error(error);
      }
    });

  // Remove recipe
  recipes
    .command('remove')
    .alias('rm')
    .description('Remove recipe')
    .argument('<query>', 'Recipe name or ID')
    .action(async (query) => {
      await dataManager.init();

      const spinner = ora('Removing recipe...').start();

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

        const confirmed = await inquirer.prompt([{
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