import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { createRecipeBody, recipeIdParams, updateRecipeBody } from './recipe.schema.js'
import { deleteRecipeHandler, getRecipes, postRecipe, putRecipe } from './recipe.controller.js'

export const recipeRouter = Router()

recipeRouter.get('/', getRecipes)
recipeRouter.post('/', validate({ body: createRecipeBody }), postRecipe)
recipeRouter.put('/:id', validate({ params: recipeIdParams, body: updateRecipeBody }), putRecipe)
recipeRouter.delete('/:id', validate({ params: recipeIdParams }), deleteRecipeHandler)

