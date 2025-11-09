import { asyncHandler } from '../../shared/asyncHandler.js'
import { HttpError } from '../../shared/httpError.js'
import { createRecipe, deleteRecipe, listRecipes, updateRecipe } from './recipe.repository.js'

export const getRecipes = asyncHandler(async (req, res) => {
  const recipes = await listRecipes((req as any).userId)
  res.json(recipes)
})

export const postRecipe = asyncHandler(async (req, res) => {
  const recipe = await createRecipe((req as any).userId, req.body)
  res.status(201).json(recipe)
})

export const putRecipe = asyncHandler(async (req, res) => {
  const updated = await updateRecipe(req.params.id, req.body)
  if (!updated) throw new HttpError(404, 'Recipe not found')
  res.json(updated)
})

export const deleteRecipeHandler = asyncHandler(async (req, res) => {
  const deleted = await deleteRecipe(req.params.id)
  if (!deleted) throw new HttpError(404, 'Recipe not found')
  res.status(204).end()
})
