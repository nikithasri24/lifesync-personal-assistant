import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { createFocusSessionBody, sessionIdParams, updateFocusSessionBody } from './focus.schema.js'
import { getFocusSessions, postFocusSession, putFocusSession } from './focus.controller.js'

export const focusRouter = Router()

focusRouter.get('/sessions', getFocusSessions)
focusRouter.post('/sessions', validate({ body: createFocusSessionBody }), postFocusSession)
focusRouter.put('/sessions/:id', validate({ params: sessionIdParams, body: updateFocusSessionBody }), putFocusSession)

