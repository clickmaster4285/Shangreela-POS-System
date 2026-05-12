import { useCallback, useRef, useState } from 'react';

/**
 * Prevents duplicate submissions for the same action key while async work is in-flight.
 */
export function useSubmitLock() {
  const locksRef = useRef<Set<string>>(new Set());
  const [, bump] = useState(0);

  const isLocked = useCallback((key: string) => {
    return locksRef.current.has(key);
  }, []);

  const runLocked = useCallback(async <T,>(key: string, fn: () => Promise<T>): Promise<T | undefined> => {
    if (locksRef.current.has(key)) return undefined;
    locksRef.current.add(key);
    bump((x) => x + 1);
    try {
      return await fn();
    } finally {
      locksRef.current.delete(key);
      bump((x) => x + 1);
    }
  }, []);

  return { isLocked, runLocked };
}
