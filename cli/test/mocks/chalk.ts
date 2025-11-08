const handler = {
  get: () => (s: any) => String(s),
}
export default new Proxy({}, handler as any)
