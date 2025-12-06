import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { createPantryItemBody, itemIdParams, updatePantryItemBody } from './pantry.schema.js'
import { deletePantryItemHandler, getPantryItems, postPantryItem, putPantryItem } from './pantry.controller.js'

export const pantryRouter = Router()

pantryRouter.get('/items', getPantryItems)
pantryRouter.post('/items', validate({ body: createPantryItemBody }), postPantryItem)
pantryRouter.put('/items/:id', validate({ params: itemIdParams, body: updatePantryItemBody }), putPantryItem)
pantryRouter.delete('/items/:id', validate({ params: itemIdParams }), deletePantryItemHandler)

