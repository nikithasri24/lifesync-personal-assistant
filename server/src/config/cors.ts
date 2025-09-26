import type { CorsOptions } from 'cors';
import { env } from './env.js';

const allowAll = env.NODE_ENV !== 'production' && env.corsOrigins.length === 0;

export const corsOptions: CorsOptions = allowAll
  ? { origin: true, credentials: true }
  : {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        if (env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
