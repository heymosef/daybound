import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/** Pointer intent keeps vertical page scrolling native; wheel/keys are separate native paths. */
export function useTimelineScrub(ref: RefObject<HTMLElement>, cellWidth: number,
  onPan?: (hours: number) => void, onReset?: () => void) {
  const latest = useRef({ cellWidth, onPan, onReset });
  useLayoutEffect(() => { latest.current = { cellWidth, onPan, onReset }; }, [cellWidth, onPan, onReset]);
  const enabled = !!onPan;
  useEffect(() => {
    const viewport = ref.current;
    if (!viewport || !enabled) return;
    let drag: { id: number; x: number; y: number; lastX: number; active: boolean } | undefined;
    let frame = 0;
    let pending = 0;
    const width = () => latest.current.cellWidth || (parseFloat(getComputedStyle(viewport).fontSize) || 16) * 3.25;
    const flush = () => {
      cancelAnimationFrame(frame); frame = 0;
      if (pending) { latest.current.onPan?.(pending / width()); pending = 0; }
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, active: false };
      viewport.setPointerCapture?.(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag = undefined; return; }
        drag.active = true;
        viewport.dataset.scrubbing = "true";
      }
      pending += drag.lastX - event.clientX;
      drag.lastX = event.clientX;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const end = () => {
      flush(); drag = undefined;
      delete viewport.dataset.scrubbing;
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // Preserve pinch zoom.
      const horizontal = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
      if (!horizontal || (!event.shiftKey && Math.abs(horizontal) < Math.abs(event.deltaY))) return;
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
      pending += horizontal * scale;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== viewport) return;
      const step = event.shiftKey ? 6 : 1;
      const delta = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step :
        event.key === "PageDown" ? 6 : event.key === "PageUp" ? -6 : 0;
      if (delta) { event.preventDefault(); latest.current.onPan?.(delta); }
      else if (event.key === "Home") {
        event.preventDefault(); cancelAnimationFrame(frame); frame = 0; pending = 0;
        latest.current.onReset?.();
      }
    };
    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
    viewport.addEventListener("lostpointercapture", end);
    viewport.addEventListener("wheel", wheel, { passive: false });
    viewport.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", end);
      viewport.removeEventListener("pointercancel", end);
      viewport.removeEventListener("lostpointercapture", end);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("keydown", key);
      delete viewport.dataset.scrubbing;
    };
  }, [ref, enabled]);
}
