import type { ErrorRequestHandler } from 'express';
import { logger } from '../config/logger.js';
import { isHttpError } from '../shared/httpError.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (isHttpError(err)) {
    if (err.status >= 500) {
      logger.error({ err, path: req.path }, 'Unhandled server error');
    } else {
      logger.warn({ err, path: req.path }, 'Handled client error');
    }

    return res.status(err.status).json({
      error: err.message,
      details: err.details ?? null
    });
  }

  logger.error({ err, path: req.path }, 'Unexpected error');
  return res.status(500).json({ error: 'Internal Server Error' });
};
