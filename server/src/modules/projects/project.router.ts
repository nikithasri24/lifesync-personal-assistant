import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import {
  deleteProjectHandler,
  getProjects,
  postProject,
  putProject
} from './project.controller.js';
import { createProjectBody, projectIdParams, updateProjectBody } from './project.schema.js';

export const projectRouter = Router();

projectRouter.get('/', getProjects);
projectRouter.post('/', validate({ body: createProjectBody }), postProject);
projectRouter.put('/:id', validate({ params: projectIdParams, body: updateProjectBody }), putProject);
projectRouter.delete('/:id', validate({ params: projectIdParams }), deleteProjectHandler);
