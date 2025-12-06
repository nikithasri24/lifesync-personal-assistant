import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';

export const requestLogger = pinoHttp({
  logger,
  autoLogging: true,
  redact: {
    paths: ['req.headers.authorization']
  }
});
