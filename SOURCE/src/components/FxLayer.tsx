import { useEffect, useRef, type MutableRefObject } from "react";
import { ConfettiEngine } from "../lib/confetti";

/** Full-bleed particle canvas. The engine instance is handed to the scene through `engineRef`. */
export function FxLayer({ engineRef, max, className = "" }: { engineRef: MutableRefObject<ConfettiEngine | null>; max?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const e = new ConfettiEngine(ref.current!, max);
    engineRef.current = e;
    return () => {
      e.destroy();
      engineRef.current = null;
    };
  }, [engineRef, max]);
  return <canvas ref={ref} className={`fx-layer ${className}`} aria-hidden="true" />;
}
