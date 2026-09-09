// Stub for the `server-only` guard package.
// Vitest runs tests in Node, so importing the real package unconditionally
// throws ("This module cannot be imported from a Client Component module").
// Bundlers (webpack/Next) resolve `server-only` to this behavior only via the
// "browser" export condition; Vitest doesn't apply that condition, so we
// alias the bare specifier at the Vite resolver level instead.
export {};
