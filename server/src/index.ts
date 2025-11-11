import cors from 'cors';
import express from 'express';
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
import { utilRouter } from './modules/util/util.router.js';
import { systemRouter } from './modules/system/system.router.js';
import { supabaseAuth, requireAuth } from './middleware/auth.js';
import { shoppingRouter } from './modules/shopping/shopping.router.js';
import { pantryRouter } from './modules/pantry/pantry.router.js';
import { mealRouter } from './modules/meal/meal.router.js';
import { focusRouter } from './modules/focus/focus.router.js';
import { recipeRouter } from './modules/recipes/recipe.router.js';
import { recipeSearchRouter } from './modules/recipes/recipe.search.router.js';
import { analyticsRouter } from './modules/analytics/analytics.router.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);
  // Basic security headers (minimal replacement for helmet)
  app.use((_req: any, res: any, next: any) => {
    try {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'SAMEORIGIN')
      res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade')
    } catch {}
    next()
  })
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  // No compression dependency; keep middleware lean for now
  app.use(supabaseAuth);

  app.get('/api/health', (_req: any, res: any) => {
    console.log('health route hit');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Require auth for data routes in production
  app.use('/api/tasks', requireAuth, taskRouter);
  app.use('/api/projects', requireAuth, projectRouter);
  app.use('/api/habits', requireAuth, habitRouter);
  app.use('/api/financial', requireAuth, financeRouter);
  app.use('/api/shopping', requireAuth, shoppingRouter);
  app.use('/api/pantry', requireAuth, pantryRouter);
  app.use('/api', requireAuth, mealRouter);
  app.use('/api/focus', requireAuth, focusRouter);
  app.use('/api/recipes', requireAuth, recipeRouter);
  // Public lightweight search endpoint used for client-side enrichment
  app.use('/api/recipe', recipeSearchRouter);
  app.use('/api/analytics', requireAuth, analyticsRouter);
  app.use('/api/util', utilRouter);
  // Back-compat paths used in UI: /api/youtube/*, /api/barcode/lookup, /api/ocr/receipt
  app.use('/api', utilRouter);
  app.use('/api', systemRouter);

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
