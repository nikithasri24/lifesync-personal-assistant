declare module 'express' {
  export type RequestHandler = any
  export type ErrorRequestHandler = any
  export function Router(): any
  const e: any
  export default e
}

declare module 'cors' {
  export type CorsOptions = any
  const c: any
  export default c
}

declare module 'helmet' {
  const h: any
  export default h
}

declare module 'compression' {
  const c: any
  export default c
}

declare module 'pino' {
  const p: any
  export default p
}

declare module 'pino-http' {
  const p: any
  export default p
}

