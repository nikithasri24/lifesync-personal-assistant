import type { RequestHandler } from 'express'
import { asyncHandler } from '../../shared/asyncHandler.js'
import { HttpError } from '../../shared/httpError.js'
import { addShoppingItem, createShoppingList, deleteShoppingItem, listShoppingItems, listShoppingLists, updateShoppingItem } from './shopping.repository.js'

export const getShoppingLists: RequestHandler = asyncHandler(async (req, res) => {
  const lists = await listShoppingLists((req as any).userId)
  res.json(lists)
})

export const postShoppingList: RequestHandler = asyncHandler(async (req, res) => {
  const list = await createShoppingList((req as any).userId, req.body)
  res.status(201).json(list)
})

export const getShoppingListItems: RequestHandler = asyncHandler(async (req, res) => {
  const items = await listShoppingItems(req.params.id)
  res.json(items)
})

export const postShoppingListItem: RequestHandler = asyncHandler(async (req, res) => {
  const item = await addShoppingItem(req.params.id, req.body)
  res.status(201).json(item)
})

export const putShoppingItem: RequestHandler = asyncHandler(async (req, res) => {
  const updated = await updateShoppingItem(req.params.id, req.body)
  if (!updated) throw new HttpError(404, 'Shopping item not found')
  res.json(updated)
})

export const deleteShoppingItemHandler: RequestHandler = asyncHandler(async (req, res) => {
  const deleted = await deleteShoppingItem(req.params.id)
  if (!deleted) throw new HttpError(404, 'Shopping item not found')
  res.json(deleted)
})
