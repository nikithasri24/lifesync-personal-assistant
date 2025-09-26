import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import {
  deleteTask,
  getTasks,
  permanentlyDeleteTaskHandler,
  postTask,
  putTask,
  restoreTaskHandler
} from './task.controller.js';
import { createTaskBody, taskIdParams, updateTaskBody } from './task.schema.js';

export const taskRouter = Router();

taskRouter.get('/', getTasks);
taskRouter.post('/', validate({ body: createTaskBody }), postTask);
taskRouter.put('/:id', validate({ params: taskIdParams, body: updateTaskBody }), putTask);
taskRouter.delete('/:id', validate({ params: taskIdParams }), deleteTask);
taskRouter.post('/:id/restore', validate({ params: taskIdParams }), restoreTaskHandler);
taskRouter.delete('/:id/permanent', validate({ params: taskIdParams }), permanentlyDeleteTaskHandler);
