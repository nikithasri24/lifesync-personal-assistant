export const notFound = (_req: any, res: any) => {
  res.status(404).json({ error: 'Not Found' });
};
