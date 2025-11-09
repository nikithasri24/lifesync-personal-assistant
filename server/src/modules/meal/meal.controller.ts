import { asyncHandler } from '../../shared/asyncHandler.js'
import { HttpError } from '../../shared/httpError.js'
import { createMealPlan, createPlannedMeal, deleteMealPlan, deletePlannedMeal, findMealPlanByWeek, listMealPlans, listPlannedMealsInRange, updateMealPlan, updatePlannedMeal } from './meal.repository.js'
import { addDays, format, parseISO } from 'date-fns'

export const getMealPlans = asyncHandler(async (req, res) => {
  const plans = await listMealPlans((req as any).userId)
  res.json(plans)
})

export const postMealPlan = asyncHandler(async (req, res) => {
  const plan = await createMealPlan((req as any).userId, req.body)
  res.status(201).json(plan)
})

export const getMealPlanForWeek = asyncHandler(async (req, res) => {
  const weekStart = String((req.query as any).weekStart || '').trim()
  if (!weekStart) {
    return res.status(400).json({ error: 'weekStart query param is required (YYYY-MM-DD)' })
  }
  const start = parseISO(weekStart)
  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ error: 'Invalid weekStart date' })
  }

  const userId = (req as any).userId
  const plan = await findMealPlanByWeek(userId, format(start, 'yyyy-MM-dd'))
  const end = addDays(start, 6)
  const meals = await listPlannedMealsInRange(userId, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
  res.json({ meal_plan: plan, planned_meals: meals })
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
