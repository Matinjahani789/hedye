import { memo, useEffect, useRef, useState } from "react";
import { useFitScale, useOnce, useTimeline, useViewport } from "../lib/hooks";
import { ABAN_INDEX, BIRTHDAY_DAY, MONTHS_1405, toFa, WEEKDAYS, WEEKDAYS_SHORT, type MonthInfo } from "../lib/persian";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

/** One month sheet. Real Solar-Hijri data: weekday offset comes from lib/persian (verified against 28 Aban = Thursday). */
const MonthSheet = memo(function MonthSheet({ m }: { m: MonthInfo }) {
  const cells = Array.from({ length: m.days }, (_, k) => k + 1);
  return (
    <div className="mp">
      <div className="mp-holes" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
      <div className="mp-hd">
        <div className="mp-name display">{m.name}</div>
        <div className="mp-meta"><span>{toFa(m.year)}</span><i /><span>{m.gregorian}</span></div>
      </div>
      <div className="mp-wk" aria-hidden="true">
        {WEEKDAYS_SHORT.map((w, i) => <span key={w} className={i === 6 ? "fri" : ""}>{w}</span>)}
      </div>
      <div className="mp-grid" role="grid" aria-label={`${m.name} ${toFa(m.year)}`}>
        {cells.map((d) => {
          const col = (m.offset + d - 1) % 7;
          const target = m.index === ABAN_INDEX && d === BIRTHDAY_DAY;
          return (
            <span
              key={d}
              className={`mp-d ${col === 6 ? "fri" : ""}`}
              style={d === 1 ? { gridColumnStart: m.offset + 1 } : undefined}
              data-target={target ? "1" : undefined}
              title={target ? `${WEEKDAYS[col]} ${toFa(d)} ${m.name}` : undefined}
            >
              {toFa(d)}
              {target && (
                <svg className="mp-circle" viewBox="0 0 60 50" aria-hidden="true">
                  <path pathLength={1} d="M31 4 C48 2 59 13 57 26 C55 40 41 47 27 46 C12 45 2 35 4 22 C6 10 19 3 40 7" />
                </svg>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
});

function Page({ m, i, flipped }: { m: MonthInfo; i: number; flipped: boolean }) {
  return (
    <div className={`pg ${flipped ? "flipped" : ""}`} style={{ ["--z" as string]: `${(MONTHS_1405.length - 1 - i) * 1.2}px` }}>
      <div className="pg-top pg-leaf"><div className="pg-in pg-in-top"><MonthSheet m={m} /></div></div>
      <div className="pg-back-top pg-leaf" />
      <div className="pg-bot">
        <div className="pg-bot-front pg-leaf"><div className="pg-in pg-in-bot"><MonthSheet m={m} /></div></div>
        <div className="pg-bot-back pg-leaf" />
      </div>
    </div>
  );
}

interface Cam { s: number; x: number; y: number; dur: number }

/** Scene 08 — 3D desk calendar: pages physically flip Farvardin → Aban, camera finds 28, red circle, cinematic zoom. */
export default function Scene08Calendar({ onNext }: SceneProps) {
  const tl = useTimeline();
  const once = useOnce();
  const { w, h } = useViewport();
  const fit = useFitScale(400, 430, 8, 130, 1.3);
  const scene = useRef<HTMLElement>(null);
  const cam = useRef<Cam>({ s: 1, x: 0, y: 0, dur: 0 });
  const [camState, setCamState] = useState<Cam>(cam.current);
  const [turned, setTurned] = useState(0);
  const [flat, setFlat] = useState(false);
  const [focus, setFocus] = useState(false);
  const [draw, setDraw] = useState(false);
  const [fin, setFin] = useState(false);
  const [impact, setImpact] = useState(false);

  const setCam = (c: Cam) => { cam.current = c; setCamState(c); };

  useEffect(() => {
    const N = MONTHS_1405.length - 1; // 7 flips → Aban on top
    const STEP = 900, T0 = 1500;
    for (let i = 0; i < N; i++) tl.at(T0 + i * STEP, () => { setTurned(i + 1); sfx.flip(); });
    const tEnd = T0 + (N - 1) * STEP + 1300;

    // Camera: approach (flatten + larger)
    tl.at(tEnd, () => { setFlat(true); setCam({ s: 1.28, x: 0, y: 0, dur: 2200 }); });

    // Camera: slow focus on 28
    tl.at(tEnd + 2500, () => {
      setFocus(true);
      const m = measure();
      if (!m) return;
      const S = 3.3;
      setCam({ s: S, x: -S * (m.p0.x - m.c.x), y: -S * (m.p0.y - m.c.y), dur: 2800 });
    });

    // Hand-drawn red circle
    tl.at(tEnd + 5700, () => { setDraw(true); sfx.pop(); });

    // Dramatic zoom
    tl.at(tEnd + 7500, () => {
      const m = measure();
      if (!m) return;
      setFin(true);
      const S = Math.max(4, (0.74 * Math.min(window.innerWidth, window.innerHeight)) / m.cw0);
      setCam({ s: S, x: -S * (m.p0.x - m.c.x), y: -S * (m.p0.y - m.c.y), dur: 2800 });
      sfx.whoosh();
    });
    tl.at(tEnd + 7500 + 2700, () => { setImpact(true); sfx.chime(); });
    tl.at(tEnd + 7500 + 4300, () => once(onNext));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Where is the 28th, in un-zoomed screen space (camera translation is 0 whenever this is called). */
  function measure() {
    const el = scene.current?.querySelector<HTMLElement>(".pg-bot-front [data-target]");
    const sc = scene.current;
    if (!el || !sc) return null;
    const r = el.getBoundingClientRect();
    const s = sc.getBoundingClientRect();
    const c = { x: s.left + s.width / 2, y: s.top + s.height / 2 };
    const { s: k, x: tx, y: ty } = cam.current;
    const p1 = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    const p0 = { x: c.x + (p1.x - c.x - tx) / k, y: c.y + (p1.y - c.y - ty) / k };
    return { c, p0, cw0: r.width / k };
  }
  void w; void h;

  return (
    <section className={`scene cal-scene ${flat ? "cal-flat" : ""} ${focus ? "cal-focus" : ""} ${draw ? "cal-draw" : ""} ${fin ? "cal-final" : ""} ${impact ? "cal-impact" : ""}`} ref={scene} aria-label="تقویم">
      <div
        className="cal-cam"
        style={{ transform: `translate(${camState.x}px, ${camState.y}px) scale(${camState.s})`, transitionDuration: `${camState.dur}ms` }}
      >
        <div className="cal-persp">
          <div className="cal-fit" style={{ transform: `scale(${fit})` }}>
            <div className="cal-floor" />
            <div className="cal-rig">
              {/* base */}
              <div className="cal-base">
                <div className="cb-face cb-front" />
                <div className="cb-face cb-right" />
                <div className="cb-face cb-top" />
              </div>
              <div className="cal-board" />
              <div className="cal-edge" />
              <div className="cal-stack">
                {MONTHS_1405.map((m, i) => (
                  <Page key={m.index} m={m} i={i} flipped={i < turned} />
                ))}
              </div>
              <div className="cal-rings" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ left: `${38 + i * 34}px` }} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="cal-flash" />
      <div className="cal-vignette" />
    </section>
  );
}
