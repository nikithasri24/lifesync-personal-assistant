import { z } from 'zod';

const statusEnum = z.enum(['active', 'completed', 'on_hold']);

export const createProjectBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, { message: 'color must be a valid hex value' }).optional(),
  status: statusEnum.optional(),
  icon: z.string().optional()
});

export const updateProjectBody = createProjectBody.partial();

export const projectIdParams = z.object({
  id: z.string().uuid()
});

export type CreateProjectBody = z.infer<typeof createProjectBody>;
export type UpdateProjectBody = z.infer<typeof updateProjectBody>;
