import { useState } from 'react';

export function useControlledInput<T>(
  externalValue?: T,
  externalOnChange?: (value: T) => void
) {
  const isControlled = externalValue !== undefined;
  const [internalValue, setInternalValue] = useState<T>(
    externalValue !== undefined ? externalValue : ('' as T)
  );

  const value = isControlled ? externalValue : internalValue;
  const setValue = isControlled
    ? externalOnChange || (() => {})
    : setInternalValue;

  return { value, setValue, isControlled };
}
