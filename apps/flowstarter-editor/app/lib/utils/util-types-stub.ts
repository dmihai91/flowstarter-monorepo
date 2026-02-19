/**
 * Stub for util/types used by undici
 * These are Node.js built-in type checking functions
 */

export function isAnyArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

export function isTypedArray(value: unknown): value is NodeJS.TypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

export function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value);
}

export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

export function isDataView(value: unknown): value is DataView {
  return value instanceof DataView;
}

export function isExternal(_value: unknown): boolean {
  return false;
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

export function isMap(value: unknown): value is Map<unknown, unknown> {
  return value instanceof Map;
}

export function isSet(value: unknown): value is Set<unknown> {
  return value instanceof Set;
}

export function isWeakMap(value: unknown): value is WeakMap<object, unknown> {
  return value instanceof WeakMap;
}

export function isWeakSet(value: unknown): value is WeakSet<object> {
  return value instanceof WeakSet;
}

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise;
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

export function isSharedArrayBuffer(value: unknown): value is SharedArrayBuffer {
  return typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer;
}

// Export as default object too for CommonJS compatibility
export default {
  isAnyArrayBuffer,
  isTypedArray,
  isArrayBufferView,
  isUint8Array,
  isDataView,
  isExternal,
  isDate,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  isRegExp,
  isPromise,
  isArrayBuffer,
  isSharedArrayBuffer,
};

