import { asyncHandler } from '../../shared/asyncHandler.js'
import { HttpError } from '../../shared/httpError.js'
import { createFocusSession, listFocusSessions, updateFocusSession } from './focus.repository.js'

export const getFocusSessions = asyncHandler(async (req, res) => {
  const sessions = await listFocusSessions((req as any).userId)
  res.json(sessions)
})

export const postFocusSession = asyncHandler(async (req, res) => {
  const session = await createFocusSession((req as any).userId, req.body)
  res.status(201).json(session)
})

export const putFocusSession = asyncHandler(async (req, res) => {
  const updated = await updateFocusSession(req.params.id, req.body)
  if (!updated) throw new HttpError(404, 'Focus session not found')
  res.json(updated)
})
