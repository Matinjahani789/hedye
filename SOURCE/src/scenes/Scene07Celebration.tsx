import { useEffect, useRef, useState } from "react";
import { FxLayer } from "../components/FxLayer";
import type { ConfettiEngine } from "../lib/confetti";
import { useOnce, useTimeline } from "../lib/hooks";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

/** Scene 07 — cinematic celebration: «تولدت مبارک» emerges, paper confetti, a 3D «۲۴» arrives from behind. */
export default function Scene07Celebration({ onNext }: SceneProps) {
  const tl = useTimeline();
  const once = useOnce();
  const fx = useRef<ConfettiEngine | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const origin = () => {
      const t = textRef.current?.getBoundingClientRect();
      const h = host.current?.getBoundingClientRect();
      if (!t || !h) return { x: 200, y: 260, w: 400, h: 700 };
      return { x: t.left - h.left + t.width / 2, y: t.top - h.top + t.height / 2, w: h.width, h: h.height };
    };
    tl.at(700, () => setPhase(1));
    tl.at(2500, () => {
      setPhase(2);
      sfx.chime();
      const o = origin();
      fx.current?.burst({ x: o.x, y: o.y, count: 150, power: 1, spread: Math.PI * 1.25 });
      tl.at(250, () => fx.current?.burst({ x: o.x, y: o.y, count: 36, power: 1.15, spread: Math.PI * 1.1, gold: true }));
      tl.at(600, () => fx.current?.burst({ x: o.x, y: o.y, count: 60, power: 0.8, spread: Math.PI * 1.5 }));
    });
    tl.at(3500, () => { setPhase(3); sfx.whoosh(); });
    tl.at(6700, () => {
      setPhase(4);
      sfx.pop();
      const o = origin();
      fx.current?.burst({ x: o.w * 0.12, y: o.h * 0.92, count: 42, power: 0.95, spread: Math.PI * 0.45, angle: -Math.PI * 0.36 });
      fx.current?.burst({ x: o.w * 0.88, y: o.h * 0.92, count: 42, power: 0.95, spread: Math.PI * 0.45, angle: -Math.PI * 0.64 });
      fx.current?.burst({ x: o.x, y: o.y, count: 26, power: 0.7, spread: Math.PI * 1.2, gold: true });
    });
    tl.at(10600, () => once(onNext));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={`scene cb-scene cb-p${phase}`} ref={host} aria-label="جشن تولد">
      <FxLayer engineRef={fx} className="cb-fx" max={460} />
      <div className="cb-stage">
        <div className="cb-lite" />
        <div className="cb-num-wrap">
          <div className="cb-floor" />
          <div className="cb-ring" />
          <div className="cb-num" data-text="۲۴" aria-label="۲۴">
            ۲۴
          </div>
        </div>
        <div className="cb-text-wrap" ref={textRef}>
          <h1 className="cb-text display">
            <span className="cb-w" style={{ ["--i" as string]: 0 }}>تولدت</span>
            <span className="cb-w" style={{ ["--i" as string]: 1 }}>مبارک</span>
          </h1>
        </div>
      </div>
    </section>
  );
}
