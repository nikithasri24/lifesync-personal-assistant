export const logger = {
  info: (context: string, ...args: unknown[]): void => {
    console.log(...args);
  },
  error: (context: string, ...args: unknown[]): void => {
    console.error(...args);
  },
  warn: (context: string, ...args: unknown[]): void => {
    console.warn(...args);
  },
  debug: (context: string, ...args: unknown[]): void => {
    console.debug(...args);
  }
};
