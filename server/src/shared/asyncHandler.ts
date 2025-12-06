export const asyncHandler = (handler: (req: any, res: any, next: any) => any) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  }
}
