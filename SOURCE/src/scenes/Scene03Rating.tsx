import { useRef, useState } from "react";
import { FxLayer } from "../components/FxLayer";
import type { ConfettiEngine } from "../lib/confetti";
import { useOnce, useTimeline } from "../lib/hooks";
import { toFa } from "../lib/persian";
import { boxOf, findSafeSpot, playBounds, type Box } from "../lib/safePosition";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

const N = 10;

/** Scene 03 — «چقدر تولدت خوب بود؟» : 1–9 escape, 10 is the only (stable) answer. */
export default function Scene03Rating({ onNext }: SceneProps) {
  const tl = useTimeline();
  const once = useOnce();
  const fx = useRef<ConfettiEngine | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const [offs, setOffs] = useState(() => Array.from({ length: N }, () => ({ x: 0, y: 0 })));
  const offsRef = useRef(offs);
  const busy = useRef<boolean[]>(Array(N).fill(false));
  const [win, setWin] = useState(false);

  const escape = (i: number, e: React.MouseEvent) => {
    if (busy.current[i]) return;
    busy.current[i] = true;
    tl.at(620, () => (busy.current[i] = false));
    sfx.tap();
    const s = stage.current, b = btns.current[i], sl = slots.current[i];
    if (!s || !b || !sl) return;
    const bounds = playBounds(s);
    const base = sl.getBoundingClientRect();
    const mineBox = (k: number): Box => {
      const r = slots.current[k]!.getBoundingClientRect();
      const o = offsRef.current[k];
      return { left: r.left + o.x, top: r.top + o.y, right: r.right + o.x, bottom: r.bottom + o.y };
    };
    const hard: Box[] = [boxOf(title.current!.getBoundingClientRect()), boxOf(slots.current[N - 1]!.getBoundingClientRect())];
    const soft: Box[] = [];
    for (let k = 0; k < N - 1; k++) if (k !== i) soft.push(mineBox(k));
    const spot = findSafeSpot({
      bounds,
      size: { w: b.offsetWidth, h: b.offsetHeight },
      hard,
      soft,
      from: mineBox(i),
      minTravel: 110,
      avoid: e.clientX || e.clientY ? { x: e.clientX, y: e.clientY, r: 100 } : undefined,
      margin: 12,
    });
    const next = offsRef.current.map((o, k) => (k === i ? { x: spot.left - base.left, y: spot.top - base.top } : o));
    offsRef.current = next;
    setOffs(next);
  };

  const pick10 = () => {
    if (win) return;
    sfx.chime();
    once(() => {
      setWin(true);
      const r = btns.current[N - 1]!.getBoundingClientRect();
      const host = stage.current!.getBoundingClientRect();
      fx.current?.sparkle(r.left - host.left + r.width / 2, r.top - host.top + r.height / 2, 26);
      tl.at(350, () => fx.current?.sparkle(r.left - host.left + r.width / 2, r.top - host.top + r.height / 2, 18));
      tl.at(1900, onNext);
    });
  };

  return (
    <section className={`scene r-scene ${win ? "is-win" : ""}`} ref={stage} aria-label="امتیاز تولد">
      <div className="r-glow" />
      <div className="col">
        <p className="kicker">از ۱ تا ۱۰</p>
        <h1 ref={title} className="h-title">چقدر تولدت خوب بود؟</h1>
        <div className="gold-rule" style={{ margin: "14px auto 24px" }} />
        <div className="r-card">
          <div className="r-grid">
            {Array.from({ length: N }, (_, i) => {
              const last = i === N - 1;
              return (
                <div key={i} className="r-slot" ref={(el) => { slots.current[i] = el; }}>
                  <button
                    ref={(el) => { btns.current[i] = el; }}
                    type="button"
                    className={`r-btn num ${last ? "is-ten" : ""} ${!last && (offs[i].x || offs[i].y) ? "is-moved" : ""} ${last && win ? "is-won" : ""}`}
                    style={last ? undefined : { transform: `translate(${offs[i].x}px, ${offs[i].y}px)` }}
                    onClick={last ? pick10 : (e) => escape(i, e)}
                    aria-label={toFa(i + 1)}
                  >
                    {toFa(i + 1)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <FxLayer engineRef={fx} max={120} />
    </section>
  );
}
