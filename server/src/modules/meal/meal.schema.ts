import { z } from 'zod'

export const createMealPlanBody = z.object({
  name: z.string().min(1),
  week_start_date: z.string(),
  notes: z.string().optional(),
})
export const mealPlanIdParams = z.object({ id: z.string().uuid() })
export const updateMealPlanBody = createMealPlanBody.partial()

export const createPlannedMealBody = z.object({
  meal_plan_id: z.string().uuid(),
  recipe_id: z.string().uuid().optional(),
  meal_type: z.string().min(1),
  date: z.string(),
  servings: z.number().int().positive().optional(),
  custom_meal: z.string().optional(),
  people_count: z.number().int().positive().optional(),
  status: z.enum(['planned','prepped','cooked','eaten']).optional(),
  notes: z.string().optional(),
})
export const plannedMealIdParams = z.object({ id: z.string().uuid() })
export const updatePlannedMealBody = createPlannedMealBody.partial()

