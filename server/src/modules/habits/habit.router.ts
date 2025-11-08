import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { getHabits, postHabit, postHabitEntry, putHabit, deleteHabit } from './habit.controller.js';
import { createHabitBody, createHabitEntryBody, habitIdParams, updateHabitBody } from './habit.schema.js';

export const habitRouter = Router();

habitRouter.get('/', getHabits);
habitRouter.post('/', validate({ body: createHabitBody }), postHabit);
habitRouter.post('/:id/entries', validate({ params: habitIdParams, body: createHabitEntryBody }), postHabitEntry);
habitRouter.put('/:id', validate({ params: habitIdParams, body: updateHabitBody }), putHabit);
habitRouter.delete('/:id', validate({ params: habitIdParams }), deleteHabit);
