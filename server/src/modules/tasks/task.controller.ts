import type { RequestHandler } from 'express';
import { HttpError } from '../../shared/httpError.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import {
  createTask,
  listTasks,
  permanentlyDeleteTask,
  restoreTask,
  softDeleteTask,
  updateTask
} from './task.repository.js';
import type { CreateTaskBody, UpdateTaskBody } from './task.schema.js';

export const getTasks: RequestHandler = asyncHandler(async (_req, res) => {
  const tasks = await listTasks();
  res.json(tasks);
});

export const postTask: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CreateTaskBody;
  const task = await createTask(body);
  res.status(201).json(task);
});

export const putTask: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as UpdateTaskBody;
  const { id } = req.params;
  const task = await updateTask(id, body);

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  res.json(task);
});

export const deleteTask: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await softDeleteTask(id);

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  res.json(task);
});

export const restoreTaskHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await restoreTask(id);

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  res.json(task);
});

export const permanentlyDeleteTaskHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await permanentlyDeleteTask(id);

  if (!task) {
    throw new HttpError(404, 'Task not found');
  }

  res.json({ message: 'Task permanently deleted', task });
});
