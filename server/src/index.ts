import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { logger } from './config/logger.js';
import { pool } from './db/pool.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestLogger } from './middleware/requestLogger.js';
import { projectRouter } from './modules/projects/project.router.js';
import { taskRouter } from './modules/tasks/task.router.js';
import { habitRouter } from './modules/habits/habit.router.js';
import { financeRouter } from './modules/finance/finance.router.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  app.get('/api/health', (_req, res) => {
    console.log('health route hit');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/tasks', taskRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/habits', habitRouter);
  app.use('/api/financial', financeRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export async function startServer() {
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'LifeSync API server listening');
  });

  const shutdown = async () => {
    logger.info('Shutting down server');
    server.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  startServer().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}
