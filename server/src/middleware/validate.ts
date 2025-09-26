import type { RequestHandler } from 'express';
import type { AnyZodObject, ZodEffects } from 'zod';
import { HttpError } from '../shared/httpError.js';

const parse = async <T>(schema: AnyZodObject | ZodEffects<any>, data: unknown) => schema.parseAsync(data);

interface ValidateOptions {
  body?: AnyZodObject | ZodEffects<any>;
  query?: AnyZodObject | ZodEffects<any>;
  params?: AnyZodObject | ZodEffects<any>;
}

export const validate = (options: ValidateOptions): RequestHandler => async (req, _res, next) => {
  try {
    if (options.body) {
      req.body = await parse(options.body, req.body);
    }
    if (options.query) {
      await parse(options.query, req.query);
    }
    if (options.params) {
      await parse(options.params, req.params);
    }
    next();
  } catch (error) {
    next(new HttpError(400, 'Validation failed', error));
  }
};
