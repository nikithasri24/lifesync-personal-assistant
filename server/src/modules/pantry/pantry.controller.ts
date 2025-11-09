import { asyncHandler } from '../../shared/asyncHandler.js'
import { HttpError } from '../../shared/httpError.js'
import { createPantryItem, deletePantryItem, listPantryItems, updatePantryItem } from './pantry.repository.js'

export const getPantryItems = asyncHandler(async (req, res) => {
  const items = await listPantryItems((req as any).userId)
  res.json(items)
})

export const postPantryItem = asyncHandler(async (req, res) => {
  const item = await createPantryItem((req as any).userId, req.body)
  res.status(201).json(item)
})

export const putPantryItem = asyncHandler(async (req, res) => {
  const updated = await updatePantryItem(req.params.id, req.body)
  if (!updated) throw new HttpError(404, 'Pantry item not found')
  res.json(updated)
})

export const deletePantryItemHandler = asyncHandler(async (req, res) => {
  const deleted = await deletePantryItem(req.params.id)
  if (!deleted) throw new HttpError(404, 'Pantry item not found')
  res.json(deleted)
})
