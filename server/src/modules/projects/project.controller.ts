import type { RequestHandler } from 'express';
import { HttpError } from '../../shared/httpError.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject
} from './project.repository.js';
import type { CreateProjectBody, UpdateProjectBody } from './project.schema.js';

export const getProjects: RequestHandler = asyncHandler(async (req, res) => {
  const projects = await listProjects((req as any).userId);
  res.json(projects);
});

export const postProject: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as CreateProjectBody;
  const project = await createProject((req as any).userId, body);
  res.status(201).json(project);
});

export const putProject: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as UpdateProjectBody;
  const { id } = req.params;
  const project = await updateProject(id, body);

  if (!project) {
    throw new HttpError(404, 'Project not found');
  }

  res.json(project);
});

export const deleteProjectHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await deleteProject(id);

  if (!project) {
    throw new HttpError(404, 'Project not found');
  }

  res.json({ message: 'Project deleted', project });
});
