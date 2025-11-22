export const logger = {
  info: (context: string, message: string): void => {
    console.log(message);
  },
  error: (context: string, error: unknown): void => {
    console.error(error);
  },
  warn: (context: string, message: string): void => {
    console.warn(message);
  },
  debug: (context: string, message: string): void => {
    console.debug(message);
  }
};
