import type { RequestHandler } from 'express';
import { HttpError } from '../../shared/httpError.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { createHabit, listHabits, upsertHabitEntry, updateHabit as repoUpdateHabit, deleteHabit as repoDeleteHabit } from './habit.repository.js';
import type { CreateHabitBody, CreateHabitEntryBody, UpdateHabitBody } from './habit.schema.js';

export const getHabits: RequestHandler = asyncHandler(async (req, res) => {
  const habits = await listHabits((req as any).userId);
  res.json(habits);
});

export const postHabit: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CreateHabitBody;
  const habit = await createHabit((req as any).userId, body);
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

export const putHabit: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as UpdateHabitBody
  const { id } = req.params
  const habit = await repoUpdateHabit(id, body)
  if (!habit) {
    throw new HttpError(404, 'Habit not found')
  }
  res.json(habit)
})

export const deleteHabit: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params
  const habit = await repoDeleteHabit(id)
  if (!habit) {
    throw new HttpError(404, 'Habit not found')
  }
  res.json({ message: 'Habit deleted', habit })
})
