import { useEffect, useMemo, useRef, useState } from "react";
import { FxLayer } from "../components/FxLayer";
import { Reveal } from "../components/Reveal";
import { ease, lerp, tween } from "../lib/animation-controller";
import type { ConfettiEngine } from "../lib/confetti";
import { useOnce, useTimeline } from "../lib/hooks";
import { sfx } from "../lib/sound";
import type { Pt, SceneProps } from "../lib/types";

const VB_W = 100;
const VB_H = 130;

// unit-box key points of the numerals (12 stars each → exactly 24 stars)
const U2: Pt[] = [[0.06, 0.24], [0.18, 0.08], [0.45, 0], [0.76, 0.06], [0.94, 0.24], [0.88, 0.43], [0.62, 0.62], [0.34, 0.8], [0.04, 1], [0.36, 1], [0.68, 1], [0.98, 1]].map(([x, y]) => ({ x, y }));
const U4: Pt[] = [[0.68, 1], [0.68, 0.75], [0.68, 0.5], [0.68, 0.25], [0.68, 0], [0.4, 0.3], [0.2, 0.5], [0, 0.68], [0.25, 0.68], [0.52, 0.68], [0.78, 0.68], [1, 0.68]].map(([x, y]) => ({ x, y }));

const DW = 30, DH = 56, TOP = 42;
const TARGET: Pt[] = [
  ...U2.map((p) => ({ x: 14 + p.x * DW, y: TOP + p.y * DH })),
  ...U4.map((p) => ({ x: 57 + p.x * DW, y: TOP + p.y * DH })),
];

const hash = (n: number) => Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
const LOOSE: Pt[] = Array.from({ length: 24 }, (_, i) => {
  if (i < 12) return { x: 9 + i * 7.7 + (hash(i) - 0.5) * 3, y: 28 + Math.sin(i * 0.75) * 10 + (hash(i + 9) - 0.5) * 5 };
  const k = i - 12;
  return { x: 92 - k * 7.7 + (hash(i) - 0.5) * 3, y: 100 + Math.cos(k * 0.7) * 9 + (hash(i + 9) - 0.5) * 5 };
});

const LINES: [number, number][] = [
  ...Array.from({ length: 11 }, (_, i) => [i, i + 1] as [number, number]),
  ...Array.from({ length: 11 }, (_, i) => [12 + i, 13 + i] as [number, number]),
];

const SPECIAL = [2, 14, 21];
const NOTES = ["امیدوارم همیشه خوش‌شانس باشی.", "امیدوارم همیشه آدم‌های خوب کنارت باشن.", "امیدوارم بهترین روزهای زندگیت هنوز در راه باشن."];
const COLORS = ["#C7A76A", "#D9BE82", "#E2D0A5", "#B19A83"];

/** Scene 06 — 24 stars, progressive gold SVG lines, 3 wishing stars, finale morphs into the number 24. */
export default function Scene06Constellation({ onNext }: SceneProps) {
  const tl = useTimeline();
  const once = useOnce();
  const fx = useRef<ConfettiEngine | null>(null);
  const starEls = useRef<(SVGGElement | null)[]>([]);
  const lineEls = useRef<(SVGLineElement | null)[]>([]);
  const cancel = useRef<() => void>(() => {});
  const [hint, setHint] = useState(false);
  const [active, setActive] = useState<boolean[]>([false, false, false]);
  const [note, setNote] = useState<number | null>(null);
  const [finale, setFinale] = useState(false);
  const [formed, setFormed] = useState(false);

  const stars = useMemo(
    () => LOOSE.map((p, i) => ({
      p, i,
      r: SPECIAL.includes(i) ? 3.4 : 1 + hash(i + 3) * 1.9,
      color: COLORS[(hash(i + 5) * COLORS.length) | 0],
      delay: 500 + i * 135,
      tw: 2.2 + hash(i + 7) * 2.6,
      op: 0.55 + hash(i + 11) * 0.45,
    })),
    []
  );

  useEffect(() => {
    tl.at(4300, () => setHint(true));
    return () => cancel.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tapStar = (k: number) => {
    if (note !== null || finale) return;
    sfx.chime();
    setNote(k);
    setActive((a) => a.map((v, j) => v || j === k));
  };

  const dismiss = () => {
    if (note === null) return;
    sfx.tap();
    setNote(null);
    const all = active.every(Boolean);
    if (all && !finale) startFinale();
  };

  const startFinale = () => {
    once(() => {
      setFinale(true);
      tl.at(500, () => { fx.current?.wave(110, 2.2); sfx.whoosh(); });
      tl.at(900, () => {
        const dur = tl.rm ? 300 : 2800;
        cancel.current = tween(dur, (t) => {
          for (let i = 0; i < 24; i++) {
            const x = lerp(LOOSE[i].x, TARGET[i].x, t);
            const y = lerp(LOOSE[i].y, TARGET[i].y, t);
            starEls.current[i]?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
          }
          LINES.forEach(([a, b], k) => {
            const el = lineEls.current[k];
            if (!el) return;
            el.setAttribute("x1", String(lerp(LOOSE[a].x, TARGET[a].x, t)));
            el.setAttribute("y1", String(lerp(LOOSE[a].y, TARGET[a].y, t)));
            el.setAttribute("x2", String(lerp(LOOSE[b].x, TARGET[b].x, t)));
            el.setAttribute("y2", String(lerp(LOOSE[b].y, TARGET[b].y, t)));
          });
        }, ease.inOutCubic, () => { setFormed(true); sfx.chime(); });
      });
      tl.at(900 + 2800 + 5600, () => onNext());
    });
  };

  return (
    <section className={`scene cs-scene ${finale ? "is-finale" : ""} ${formed ? "is-formed" : ""}`} aria-label="صورت فلکی آرزوها">
      <div className="col cs-head">
        <Reveal as="h1" className="h-title" text="۲۴ سال پر از آرزوهای قشنگ..." on delay={200} step={150} />
        <p className={`h-sub cs-hint ${hint && !finale ? "on" : ""}`}>روی ستاره‌های درخشان بزن</p>
      </div>

      <div className="cs-sky">
        <svg className="cs-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="۲۴ ستاره">
          <g className="cs-lines">
            {LINES.map(([a, b], k) => (
              <line
                key={k}
                ref={(el) => { lineEls.current[k] = el; }}
                x1={LOOSE[a].x} y1={LOOSE[a].y} x2={LOOSE[b].x} y2={LOOSE[b].y}
                pathLength={1}
                className="cs-line"
                style={{ animationDelay: `${stars[b].delay + 250}ms` }}
              />
            ))}
          </g>
          {stars.map((s) => {
            const sp = SPECIAL.indexOf(s.i);
            const isSp = sp >= 0;
            return (
              <g key={s.i} ref={(el) => { starEls.current[s.i] = el; }} transform={`translate(${s.p.x} ${s.p.y})`}>
                <g className={`cs-pop ${isSp ? "cs-special" : ""} ${isSp && active[sp] ? "is-on" : ""}`} style={{ animationDelay: `${s.delay}ms`, ["--op" as string]: s.op }}>
                  <g className="cs-drift" style={{ animationDuration: `${6 + s.tw}s`, animationDelay: `${-s.i * 0.7}s` }}>
                    {isSp && <circle className="cs-ring" r={s.r * 1.9} fill="none" stroke="#C7A76A" strokeWidth=".25" />}
                    <circle r={s.r * 2.2} fill="url(#cs-halo)" className="cs-halo" />
                    <path
                      className="cs-shape"
                      d="M0 -1 C.12 -.12 .12 -.12 1 0 C.12 .12 .12 .12 0 1 C-.12 .12 -.12 .12 -1 0 C-.12 -.12 -.12 -.12 0 -1Z"
                      transform={`scale(${s.r})`}
                      fill={s.color}
                      style={{ animationDuration: `${s.tw}s`, animationDelay: `${-s.i * 0.4}s` }}
                    />
                    {isSp && (
                      <circle
                        r="7" fill="transparent" className="cs-hit" tabIndex={0} role="button"
                        aria-label={`ستاره‌ی آرزو ${sp + 1}`}
                        onClick={() => tapStar(sp)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && tapStar(sp)}
                      />
                    )}
                  </g>
                </g>
              </g>
            );
          })}
          <defs>
            <radialGradient id="cs-halo">
              <stop offset="0" stopColor="#E2D0A5" stopOpacity=".7" />
              <stop offset="1" stopColor="#E2D0A5" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="cs-final col">
        {finale && formed ? <Reveal as="p" className="h-title cs-toast" text="به سلامتی ۲۴ سالگی هدیه!" on step={150} /> : <span className="cs-toast-ph">&nbsp;</span>}
      </div>

      {note !== null && (
        <div className="cs-overlay" onClick={dismiss} role="dialog" aria-label="آرزو">
          <div className="cs-note" onClick={(e) => e.stopPropagation()}>
            <svg viewBox="-10 -10 20 20" width="18" height="18" aria-hidden="true"><path d="M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9Z" fill="#C7A76A" /></svg>
            <p className="display">{NOTES[note]}</p>
            <button type="button" className="btn btn-ghost cs-ok" onClick={dismiss} autoFocus>
              {active.every(Boolean) ? "ادامه" : "باشه ✨"}
            </button>
          </div>
        </div>
      )}
      <FxLayer engineRef={fx} max={180} />
    </section>
  );
}
