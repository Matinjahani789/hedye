import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** prefers-reduced-motion, live. */
export function useReducedMotion(): boolean {
  const [rm, setRm] = useState(() => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setRm(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return rm;
}

/**
 * Scene timeline: schedule steps at absolute offsets. Everything is cleared when the
 * component unmounts (scene exit), so no timer can outlive its scene.
 * Reduced motion compresses the delays but never skips a step.
 */
export function useTimeline() {
  const rm = useReducedMotion();
  const ids = useRef<Set<number>>(new Set());
  const rmRef = useRef(rm);
  rmRef.current = rm;

  const clear = useCallback(() => {
    ids.current.forEach((id) => clearTimeout(id));
    ids.current.clear();
  }, []);

  const at = useCallback((ms: number, fn: () => void) => {
    const delay = rmRef.current ? ms * 0.3 : ms;
    const id = window.setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, delay);
    ids.current.add(id);
    return id;
  }, []);

  useEffect(() => clear, [clear]);
  return useMemo(() => ({ at, clear, rm }), [at, clear, rm]);
}

export interface Viewport {
  w: number;
  h: number;
}

export function useViewport(): Viewport {
  const read = (): Viewport => ({
    w: Math.round(window.visualViewport?.width ?? window.innerWidth),
    h: Math.round(window.visualViewport?.height ?? window.innerHeight),
  });
  const [vp, setVp] = useState<Viewport>(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    window.visualViewport?.addEventListener("resize", on);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
      window.visualViewport?.removeEventListener("resize", on);
    };
  }, []);
  return vp;
}

/** Scale factor that fits a fixed design box into the available viewport area. */
export function useFitScale(designW: number, designH: number, padX = 24, padY = 200, max = 1.25): number {
  const { w, h } = useViewport();
  return Math.max(0.35, Math.min((w - padX) / designW, (h - padY) / designH, max));
}

export function usePageVisible(): boolean {
  const [v, setV] = useState(() => document.visibilityState !== "hidden");
  useEffect(() => {
    const on = () => setV(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return v;
}

/** Guard that only lets an action run once (rapid taps, double transitions). */
export function useOnce() {
  const done = useRef(false);
  return useCallback((fn: () => void) => {
    if (done.current) return false;
    done.current = true;
    fn();
    return true;
  }, []);
}
