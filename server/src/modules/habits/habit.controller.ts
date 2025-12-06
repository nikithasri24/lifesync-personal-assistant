import type { RequestHandler } from 'express';
import { HttpError } from '../../shared/httpError.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createHabit, listHabits, upsertHabitEntry } from './habit.repository.js';
import type { CreateHabitBody, CreateHabitEntryBody } from './habit.schema.js';

export const getHabits: RequestHandler = asyncHandler(async (_req, res) => {
  const habits = await listHabits();
  res.json(habits);
});

export const postHabit: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CreateHabitBody;
  const habit = await createHabit(body);
  res.status(201).json(habit);
});

export const postHabitEntry: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CreateHabitEntryBody;
  const { id } = req.params;

  const entry = await upsertHabitEntry({ habit_id: id, ...body });

  if (!entry) {
    throw new HttpError(500, 'Failed to upsert habit entry');
  }

  res.status(201).json(entry);
});
