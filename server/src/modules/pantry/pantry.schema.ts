import { z } from 'zod'

export const createPantryItemBody = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  location: z.string().optional(),
  expiration_date: z.string().optional(),
  notes: z.string().optional(),
  is_low_stock: z.boolean().optional(),
  low_stock_threshold: z.number().int().optional(),
})

export const itemIdParams = z.object({ id: z.string().uuid() })
export const updatePantryItemBody = createPantryItemBody.partial()

