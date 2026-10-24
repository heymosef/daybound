import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface Props {
  token: string;
  city: string;
  onUndo: () => void;
  onExpire: () => void;
  actionRef?: React.Ref<HTMLButtonElement>;
}

/** A single recovery action. The monotonic timer pauses while any reason applies. */
export function UndoCityRemoval({ token, city, onUndo, onExpire, actionRef }: Props) {
  const reasons = useRef(new Set<string>());
  const remaining = useRef(10_000);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const expire = useRef(onExpire);
  useLayoutEffect(() => { expire.current = onExpire; }, [onExpire]);
  const stop = useCallback(() => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
      remaining.current = Math.max(0, remaining.current - (performance.now() - started.current));
    }
  }, []);
  const start = useCallback(() => {
    if (timer.current !== undefined || reasons.current.size) return;
    started.current = performance.now();
    timer.current = setTimeout(() => { timer.current = undefined; expire.current(); }, remaining.current);
  }, []);
  const pause = useCallback((reason: string, active: boolean) => {
    if (active) { reasons.current.add(reason); stop(); }
    else { reasons.current.delete(reason); start(); }
  }, [start, stop]);
  useEffect(() => {
    stop();
    remaining.current = 10_000;
    if (document.hidden) reasons.current.add("hidden");
    else reasons.current.delete("hidden");
    start();
    return stop;
  }, [token, start, stop]);
  useEffect(() => {
    const visibility = () => pause("hidden", document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [pause]);
  return <div role="status" aria-label="Removed city" data-undo-notice
    onPointerEnter={() => pause("hover", true)} onPointerLeave={() => pause("hover", false)}
    onFocus={() => pause("focus", true)}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) pause("focus", false); }}
    className="flex flex-wrap items-center gap-3 rounded-md bg-[var(--dt-accent-wash)] p-3 text-sm text-[var(--dt-text)]">
    <span>City removed.</span>
    <button ref={actionRef} type="button" aria-label={`Undo removal of ${city}`} onClick={onUndo}
      className="cursor-pointer rounded px-2 py-1 font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--dt-accent)]">Undo</button>
  </div>;
}
