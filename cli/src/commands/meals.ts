import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { format, addDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { dataManager } from '../data.js';
import { MealPlan, Recipe } from '../types.js';
import { loadConfig } from '../config.js';

export function createMealsCommand(): Command {
  const meals = new Command('meals')
    .alias('meal')
    .description('Manage meal planning');

  // Add meal to plan
  meals
    .command('add')
    .alias('a')
    .description('Add meal to weekly plan')
    .argument('[meal]', 'Meal name or recipe')
    .option('-d, --date <date>', 'Date (YYYY-MM-DD or day name)', format(new Date(), 'yyyy-MM-dd'))
    .option('-t, --type <string>', 'Meal type (breakfast, lunch, dinner, snack)')
    .option('-s, --servings <number>', 'Number of servings', '4')
    .option('-p, --people <number>', 'Number of people', '4')
    .option('-n, --notes <string>', 'Notes')
    .action(async (meal, options) => {
      await dataManager.init();
      const config = await loadConfig();

      let mealName = meal;
      let mealDate = parseDate(options.date);
      let mealType = options.type || config.defaultMealType || 'dinner';
      let servings = parseInt(options.servings) || 4;
      let people = parseInt(options.people) || 4;

      // Interactive mode if no meal provided
      if (!mealName) {
        const recipes = await dataManager.getRecipes();
        const recipeChoices = recipes.map(r => ({ name: `${r.name} (${r.cuisine})`, value: r.name }));
        
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'mealOption',
            message: 'Choose meal option:',
            choices: [
              { name: 'Enter custom meal', value: 'custom' },
              { name: 'Choose from recipes', value: 'recipe' }
            ]
          }
        ]);

        if (answers.mealOption === 'recipe' && recipes.length > 0) {
          const recipeAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'recipe',
              message: 'Choose recipe:',
              choices: [
                ...recipeChoices,
                { name: 'Enter custom meal instead', value: 'custom' }
              ]
            }
          ]);

          if (recipeAnswer.recipe !== 'custom') {
            mealName = recipeAnswer.recipe;
          }
        }

        if (!mealName || answers.mealOption === 'custom') {
          const customAnswer = await inquirer.prompt([
            {
              type: 'input',
              name: 'customMeal',
              message: 'Enter meal name:',
              validate: (input) => input.trim() !== '' || 'Meal name is required'
            }
          ]);
          mealName = customAnswer.customMeal;
        }

        const detailAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'date',
            message: 'Date (YYYY-MM-DD or day name):',
            default: options.date,
            filter: parseDate
          },
          {
            type: 'list',
            name: 'type',
            message: 'Meal type:',
            choices: ['breakfast', 'lunch', 'dinner', 'snack'],
            default: mealType
          },
          {
            type: 'number',
            name: 'servings',
            message: 'Number of servings:',
            default: servings
          },
          {
            type: 'number',
            name: 'people',
            message: 'Number of people:',
            default: people
          },
          {
            type: 'input',
            name: 'notes',
            message: 'Notes (optional):'
          }
        ]);

        mealDate = detailAnswers.date;
        mealType = detailAnswers.type;
        servings = detailAnswers.servings;
        people = detailAnswers.people;
        options.notes = detailAnswers.notes;
      }

      const spinner = ora('Adding meal to plan...').start();

      try {
        // Check if it's a recipe
        const recipes = await dataManager.getRecipes();
        const recipe = recipes.find(r => r.name.toLowerCase() === mealName.toLowerCase());

        const mealPlan: Omit<MealPlan, 'id'> = {
          date: mealDate,
          mealType,
          recipeId: recipe?.id,
          customMeal: recipe ? undefined : mealName,
          servings,
          peopleCount: people,
          notes: options.notes,
          status: 'planned'
        };

        const newMeal = await dataManager.addMealPlan(mealPlan);

        spinner.succeed(chalk.green(`Added "${mealName}" to ${mealType} on ${format(mealDate, 'MMM d, yyyy')}`));
        console.log(chalk.gray(`  ${servings} servings for ${people} people`));
        if (options.notes) console.log(chalk.gray(`  Notes: ${options.notes}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to add meal'));
        console.error(error);
      }
    });

  // List weekly meal plan
  meals
    .command('week')
    .alias('w')
    .description('Show weekly meal plan')
    .option('-d, --date <date>', 'Week containing this date', format(new Date(), 'yyyy-MM-dd'))
    .action(async (options) => {
      await dataManager.init();

      const spinner = ora('Loading meal plan...').start();

      try {
        const referenceDate = parseDate(options.date);
        const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 }); // Sunday
        const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 0 });

        const meals = await dataManager.getMealPlans();
        const recipes = await dataManager.getRecipes();

        const weekMeals = meals.filter(meal => {
          const mealDate = new Date(meal.date);
          return mealDate >= weekStart && mealDate <= weekEnd;
        });

        spinner.succeed(chalk.green(`Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`));

        if (weekMeals.length === 0) {
          console.log(chalk.yellow('No meals planned for this week'));
          return;
        }

        // Group by day
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < 7; i++) {
          const currentDay = addDays(weekStart, i);
          const dayMeals = weekMeals.filter(meal => {
            const mealDate = new Date(meal.date);
            return format(mealDate, 'yyyy-MM-dd') === format(currentDay, 'yyyy-MM-dd');
          });

          console.log(`\n${chalk.bold.blue(dayNames[i])} - ${format(currentDay, 'MMM d')}`);
          
          if (dayMeals.length === 0) {
            console.log(chalk.gray('  No meals planned'));
            continue;
          }

          // Group by meal type
          const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
          mealTypes.forEach(type => {
            const typeMeals = dayMeals.filter(meal => meal.mealType === type);
            if (typeMeals.length === 0) return;

            console.log(`  ${chalk.bold(type.charAt(0).toUpperCase() + type.slice(1))}:`);
            typeMeals.forEach(meal => {
              const mealName = meal.recipeId ? 
                recipes.find(r => r.id === meal.recipeId)?.name || 'Unknown Recipe' :
                meal.customMeal || 'Unknown Meal';
              
              const statusIcon = meal.status === 'planned' ? '○' :
                               meal.status === 'prepped' ? '◔' :
                               meal.status === 'cooked' ? '◕' : '●';
              
              console.log(`    ${statusIcon} ${chalk.white(mealName)}`);
              console.log(`      ${chalk.gray(`${meal.servings} servings • ${meal.peopleCount} people`)}`);
              if (meal.notes) console.log(`      ${chalk.gray(`Notes: ${meal.notes}`)}`);
            });
          });
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to load meal plan'));
        console.error(error);
      }
    });

  // Update meal status
  meals
    .command('status')
    .alias('s')
    .description('Update meal status')
    .argument('<query>', 'Meal name or ID')
    .option('-s, --status <status>', 'Status (planned, prepped, cooked, eaten)')
    .action(async (query, options) => {
      await dataManager.init();

      const spinner = ora('Updating meal status...').start();

      try {
        const meals = await dataManager.getMealPlans();
        const recipes = await dataManager.getRecipes();
        
        const meal = meals.find(m => {
          if (m.id === query) return true;
          const mealName = m.recipeId ? 
            recipes.find(r => r.id === m.recipeId)?.name :
            m.customMeal;
          return mealName?.toLowerCase().includes(query.toLowerCase());
        });

        if (!meal) {
          spinner.fail(chalk.red('Meal not found'));
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
                { name: '○ Planned', value: 'planned' },
                { name: '◔ Prepped', value: 'prepped' },
                { name: '◕ Cooked', value: 'cooked' },
                { name: '● Eaten', value: 'eaten' }
              ]
            }
          ]);
          status = answer.status;
        }

        await dataManager.updateMealPlan(meal.id, { status });

        const mealName = meal.recipeId ? 
          recipes.find(r => r.id === meal.recipeId)?.name :
          meal.customMeal;

        spinner.succeed(chalk.green(`Updated "${mealName}" status to ${status}`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to update meal status'));
        console.error(error);
      }
    });

  // Remove meal
  meals
    .command('remove')
    .alias('rm')
    .description('Remove meal from plan')
    .argument('<query>', 'Meal name or ID')
    .action(async (query) => {
      await dataManager.init();

      const spinner = ora('Removing meal...').start();

      try {
        const meals = await dataManager.getMealPlans();
        const recipes = await dataManager.getRecipes();
        
        const meal = meals.find(m => {
          if (m.id === query) return true;
          const mealName = m.recipeId ? 
            recipes.find(r => r.id === m.recipeId)?.name :
            m.customMeal;
          return mealName?.toLowerCase().includes(query.toLowerCase());
        });

        if (!meal) {
          spinner.fail(chalk.red('Meal not found'));
          return;
        }

        const mealName = meal.recipeId ? 
          recipes.find(r => r.id === meal.recipeId)?.name :
          meal.customMeal;

        const confirmed = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Remove "${mealName}" from meal plan?`,
          default: false
        }]);

        if (!confirmed.confirm) {
          spinner.info(chalk.yellow('Cancelled'));
          return;
        }

        await dataManager.deleteMealPlan(meal.id);
        spinner.succeed(chalk.green(`Removed "${mealName}" from meal plan`));

      } catch (error) {
        spinner.fail(chalk.red('Failed to remove meal'));
        console.error(error);
      }
    });

  return meals;
}

function parseDate(dateStr: string): Date {
  // Handle day names
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = dayNames.indexOf(dateStr.toLowerCase());
  
  if (dayIndex !== -1) {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
    return addDays(today, daysUntilTarget === 0 ? 7 : daysUntilTarget); // Next occurrence
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