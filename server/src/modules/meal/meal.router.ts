import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { createMealPlanBody, createPlannedMealBody, mealPlanIdParams, plannedMealIdParams, updateMealPlanBody, updatePlannedMealBody } from './meal.schema.js'
import { deleteMealPlanHandler, deletePlannedMealHandler, getMealPlans, postMealPlan, postPlannedMeal, putMealPlan, putPlannedMeal } from './meal.controller.js'

export const mealRouter = Router()

mealRouter.get('/meal-plans', getMealPlans)
mealRouter.post('/meal-plans', validate({ body: createMealPlanBody }), postMealPlan)
mealRouter.put('/meal-plans/:id', validate({ params: mealPlanIdParams, body: updateMealPlanBody }), putMealPlan)
mealRouter.delete('/meal-plans/:id', validate({ params: mealPlanIdParams }), deleteMealPlanHandler)

mealRouter.post('/planned-meals', validate({ body: createPlannedMealBody }), postPlannedMeal)
mealRouter.put('/planned-meals/:id', validate({ params: plannedMealIdParams, body: updatePlannedMealBody }), putPlannedMeal)
mealRouter.delete('/planned-meals/:id', validate({ params: plannedMealIdParams }), deletePlannedMealHandler)

