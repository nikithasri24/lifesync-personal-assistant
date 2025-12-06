import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { getHabits, postHabit, postHabitEntry } from './habit.controller.js';
import { createHabitBody, createHabitEntryBody, habitIdParams } from './habit.schema.js';

export const habitRouter = Router();

habitRouter.get('/', getHabits);
habitRouter.post('/', validate({ body: createHabitBody }), postHabit);
habitRouter.post('/:id/entries', validate({ params: habitIdParams, body: createHabitEntryBody }), postHabitEntry);
