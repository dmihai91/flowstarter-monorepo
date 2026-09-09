// `server-only` throws when it is resolved outside a React Server Component
// graph. The unit tests here exercise pure functions from modules that carry
// the marker, so the marker is aliased to this empty module in vitest.config.ts.
export {};
