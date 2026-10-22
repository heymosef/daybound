import { useState, useCallback, useEffect, useRef, type SetStateAction } from "react";
import { readPersistentValue, type PersistenceParser } from "../utils/persistence";

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  parse: PersistenceParser<T>,
) {
  const [snapshot, setSnapshot] = useState(() => readPersistentValue(key, initialValue, parse));
  const lastWrite = useRef<typeof snapshot | null>(null);

  useEffect(() => {
    // Never overwrite unread saved data with fallback defaults during this visit.
    if (!snapshot.canPersist || !snapshot.needsWrite || lastWrite.current === snapshot) return;
    lastWrite.current = snapshot;
    let status: typeof snapshot.status = "saved";
    try {
      window.localStorage.setItem(key, JSON.stringify(snapshot.value));
    } catch {
      status = "unavailable";
    }
    setSnapshot((current) => current === snapshot ? { ...current, status, needsWrite: false } : current);
  }, [key, snapshot]);

  const setValue = useCallback((next: SetStateAction<T>) => {
    // React may replay this updater. Persist only the committed value in the effect.
    setSnapshot((current) => ({
      ...current,
      value: typeof next === "function" ? (next as (previous: T) => T)(current.value) : next,
      needsWrite: true,
    }));
  }, []);

  // Preserve the existing loading tuple slot; status is an explicit fourth value.
  return [snapshot.value, setValue, false, snapshot.status] as const;
}
