// Lightweight console-based logger to avoid external runtime deps.
// Can be swapped with pino if desired.
import { env } from './env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
const levels: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const current = (env.LOG_LEVEL as LogLevel) || 'info'

export const logger = {
  debug: (...args: unknown[]) => { if (levels[current] <= 10) console.debug('[debug]', ...args) },
  info:  (...args: unknown[]) => { if (levels[current] <= 20) console.info('[info]', ...args) },
  warn:  (...args: unknown[]) => { if (levels[current] <= 30) console.warn('[warn]', ...args) },
  error: (...args: unknown[]) => { if (levels[current] <= 40) console.error('[error]', ...args) },
}
