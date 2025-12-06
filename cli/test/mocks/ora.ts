export default function ora() {
  return {
    start: () => ({
      succeed: () => {},
      fail: () => {},
      info: () => {},
    }),
  }
}
