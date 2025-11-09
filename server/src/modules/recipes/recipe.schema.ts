import { z } from 'zod'

export const createRecipeBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  prep_time: z.number().int().nonnegative().optional(),
  cook_time: z.number().int().nonnegative().optional(),
  instructions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source_url: z.string().url().optional(),
})
export const recipeIdParams = z.object({ id: z.string().uuid() })
export const updateRecipeBody = createRecipeBody.partial()

