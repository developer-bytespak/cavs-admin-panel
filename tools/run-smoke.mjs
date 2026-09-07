/* Renders every route for every role in Node and asserts the role model holds.
   Browser APIs the components touch inside effects are stubbed; renderToString
   never runs effects, so this catches render-time regressions cheaply. */
globalThis.window = globalThis
globalThis.document = { documentElement: {}, body: { style: {} }, addEventListener() {}, removeEventListener() {}, createElement: () => ({ style: {} }) }
if (!globalThis.navigator) Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true })
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
globalThis.addEventListener = () => {}
globalThis.removeEventListener = () => {}
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0)
globalThis.cancelAnimationFrame = () => {}
globalThis.ResizeObserver = class { observe() {} disconnect() {} }
globalThis.IntersectionObserver = class { observe() {} disconnect() {} }
globalThis.scrollTo = () => {}

await import('../node_modules/.smoke/smoke.js')
