import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { createShoppingItemBody, createShoppingListBody, itemIdParams, listIdParams, updateShoppingItemBody } from './shopping.schema.js'
import { deleteShoppingItemHandler, getShoppingListItems, getShoppingLists, postShoppingList, postShoppingListItem, putShoppingItem } from './shopping.controller.js'

export const shoppingRouter = Router()

shoppingRouter.get('/lists', getShoppingLists)
shoppingRouter.post('/lists', validate({ body: createShoppingListBody }), postShoppingList)
shoppingRouter.get('/lists/:id/items', validate({ params: listIdParams }), getShoppingListItems)
shoppingRouter.post('/lists/:id/items', validate({ params: listIdParams, body: createShoppingItemBody }), postShoppingListItem)
shoppingRouter.put('/items/:id', validate({ params: itemIdParams, body: updateShoppingItemBody }), putShoppingItem)
shoppingRouter.delete('/items/:id', validate({ params: itemIdParams }), deleteShoppingItemHandler)

