import { logger } from '../config/logger.js'

export const requestLogger = (req: any, _res: any, next: any) => {
  try {
    logger.info({ method: req.method, url: req.url })
  } catch {}
  next()
}
