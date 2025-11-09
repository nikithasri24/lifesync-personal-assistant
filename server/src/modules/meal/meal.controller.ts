import { asyncHandler } from '../../shared/asyncHandler.js'
import { HttpError } from '../../shared/httpError.js'
import { createMealPlan, createPlannedMeal, deleteMealPlan, deletePlannedMeal, listMealPlans, updateMealPlan, updatePlannedMeal } from './meal.repository.js'

export const getMealPlans = asyncHandler(async (req, res) => {
  const plans = await listMealPlans((req as any).userId)
  res.json(plans)
})

export const postMealPlan = asyncHandler(async (req, res) => {
  const plan = await createMealPlan((req as any).userId, req.body)
  res.status(201).json(plan)
})

export const putMealPlan = asyncHandler(async (req, res) => {
  const updated = await updateMealPlan(req.params.id, req.body)
  if (!updated) throw new HttpError(404, 'Meal plan not found')
  res.json(updated)
})

export const deleteMealPlanHandler = asyncHandler(async (req, res) => {
  const deleted = await deleteMealPlan(req.params.id)
  if (!deleted) throw new HttpError(404, 'Meal plan not found')
  res.json({ message: 'Meal plan deleted', meal_plan: deleted })
})

export const postPlannedMeal = asyncHandler(async (req, res) => {
  const meal = await createPlannedMeal(req.body)
  res.status(201).json(meal)
})

export const putPlannedMeal = asyncHandler(async (req, res) => {
  const updated = await updatePlannedMeal(req.params.id, req.body)
  if (!updated) throw new HttpError(404, 'Planned meal not found')
  res.json(updated)
})

export const deletePlannedMealHandler = asyncHandler(async (req, res) => {
  const deleted = await deletePlannedMeal(req.params.id)
  if (!deleted) throw new HttpError(404, 'Planned meal not found')
  res.json({ message: 'Planned meal deleted', planned_meal: deleted })
})
