import { useEffect, useMemo, useRef, useState } from "react";
import { FxLayer } from "../components/FxLayer";
import { Reveal } from "../components/Reveal";
import type { ConfettiEngine } from "../lib/confetti";
import { useFitScale, useOnce, useTimeline } from "../lib/hooks";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

const D2 = "M3 14 C3 -2 33 -2 33 15 C33 30 3 42 3 57 L35 57";
const D4 = "M27 57 L27 3 L3 40 L36 40";

/** hanging cream drips along the front rim of an elliptical tier */
function drips(cx: number, cy: number, rx: number, ry: number, n: number, seed: number) {
  const out: { x: number; y: number; h: number; w: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = cx - rx + t * 2 * rx;
    const k = (x - cx) / rx;
    const y = cy + ry * Math.sqrt(Math.max(0, 1 - k * k));
    const r = Math.abs(Math.sin(i * 12.9898 + seed) * 43758.5453) % 1;
    out.push({ x, y: y - 2, w: 9 + r * 5, h: 7 + r * 18 });
  }
  return out;
}
function pearls(cx: number, cy: number, rx: number, ry: number, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const x = cx - rx + 8 + t * (2 * rx - 16);
    const k = (x - cx) / rx;
    return { x, y: cy + ry * Math.sqrt(Math.max(0, 1 - k * k)) };
  });
}

const STARS = [
  [8, 22], [92, 18], [18, 60], [86, 54], [30, 6], [72, 4], [4, 42], [96, 40], [50, 0], [14, 82], [88, 80],
];

function Flame({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <g className="flame" transform={`translate(${x} ${y})`} style={{ ["--i" as string]: i, ["--fd" as string]: `${i * 0.37}s` }}>
      <circle className="fl-glow" r="30" fill="url(#ck-glow)" />
      <circle className="fl-ring" r="5" fill="none" stroke="#E2D0A5" strokeWidth="1.2" />
      <g className="fl-body">
        <g className="fl-sway">
          <path d="M0 0 C-5.5 -5 -6.2 -12 0 -23 C6.2 -12 5.5 -5 0 0Z" fill="#F0B84E" opacity=".95" />
          <path d="M0 -.5 C-2.8 -4 -3 -8.5 0 -14 C3 -8.5 2.8 -4 0 -.5Z" fill="#FFF4CF" />
        </g>
      </g>
      <path className="fl-smoke" d="M0 -8 C-7 -18 7 -26 0 -40" fill="none" stroke="#806653" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

/** Scene 04 — Layered CSS-3D cake with 2 & 4 shaped candles, wish, extinguish, golden dust. */
export default function Scene04Cake({ onNext }: SceneProps) {
  const tl = useTimeline();
  const onceWish = useOnce();
  const onceNext = useOnce();
  const fx = useRef<ConfettiEngine | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0); // 0 rise · 1 candles · 2 flames · 3 prompt · 4 wished · 5 continue
  const [fl, setFl] = useState<"off" | "lit" | "out">("off");
  const scale = useFitScale(320, 360, 16, 330, 1.2);

  const t1 = useMemo(() => drips(160, 236, 120, 26, 11, 1), []);
  const t2 = useMemo(() => drips(160, 182, 90, 21, 9, 5), []);
  const t3 = useMemo(() => drips(160, 134, 60, 15, 6, 9), []);
  const pr = useMemo(() => pearls(160, 288, 120, 26, 13), []);
  const pr2 = useMemo(() => pearls(160, 230, 90, 21, 10), []);

  useEffect(() => {
    tl.at(1900, () => setPhase(1));
    tl.at(3500, () => { setPhase(2); setFl("lit"); sfx.pop(); });
    tl.at(5000, () => setPhase(3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wish = () => {
    onceWish(() => {
      sfx.chime();
      setPhase(4);
      setFl("out");
      const b = box.current?.getBoundingClientRect();
      const h = host.current?.getBoundingClientRect();
      if (b && h) {
        const cx = b.left - h.left + b.width / 2;
        const cy = b.top - h.top + b.height * 0.34;
        tl.at(500, () => fx.current?.rise(cx, cy, b.width * 0.5, 46));
        tl.at(1300, () => fx.current?.rise(cx, cy + 20, b.width * 0.8, 30));
        tl.at(800, () => fx.current?.sparkle(cx, cy, 20));
      }
      tl.at(3800, () => setPhase(5));
    });
  };

  const next = () => { sfx.tap(); onceNext(onNext); };
  const wished = phase >= 4;

  return (
    <section className={`scene ck-scene ${wished ? "is-wished" : ""}`} ref={host} aria-label="کیک تولد">
      <div className="ck-halo" />
      <div className="ck-fit" style={{ width: 320 * scale, height: 360 * scale }}>
        <div className="ck-box" ref={box} style={{ transform: `scale(${scale})` }}>
          <div className="ck-rise">
            <div className={`ck-3d ${phase >= 1 ? "c-on" : ""} ${fl !== "off" ? "fl-lit" : ""} ${fl === "out" ? "fl-out" : ""}`}>
              <svg className="ck-layer" style={{ transform: "translateZ(0px)" }} viewBox="0 0 320 360" aria-hidden="true">
                <defs>
                  <radialGradient id="ck-glow">
                    <stop offset="0" stopColor="#FFE9A8" stopOpacity=".75" />
                    <stop offset=".45" stopColor="#F4CF7E" stopOpacity=".25" />
                    <stop offset="1" stopColor="#F4CF7E" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="plate" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset=".6" stopColor="#F3EDE2" />
                    <stop offset="1" stopColor="#E2D7C4" />
                  </linearGradient>
                </defs>
                <ellipse cx="160" cy="326" rx="148" ry="15" fill="rgba(54,38,31,.2)" />
                <ellipse cx="160" cy="310" rx="152" ry="34" fill="url(#plate)" stroke="#E2D0A5" />
                <ellipse cx="160" cy="304" rx="128" ry="27" fill="#FFFFFF" stroke="rgba(199,167,106,.55)" />
                <ellipse cx="160" cy="304" rx="140" ry="31" fill="none" stroke="rgba(199,167,106,.5)" strokeDasharray="1 4" />
              </svg>

              <svg className="ck-layer" style={{ transform: "translateZ(14px)" }} viewBox="0 0 320 360" aria-hidden="true">
                <defs>
                  <linearGradient id="t1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#A38A72" />
                    <stop offset=".35" stopColor="#8B705B" />
                    <stop offset=".75" stopColor="#6F5543" />
                    <stop offset="1" stopColor="#5A4235" />
                  </linearGradient>
                </defs>
                <path d="M40 236 V290 A120 26 0 0 0 280 290 V236 Z" fill="url(#t1)" />
                <path d="M40 262 A120 26 0 0 0 280 262" fill="none" stroke="#E2D0A5" strokeWidth="1" opacity=".8" />
                <ellipse cx="160" cy="236" rx="120" ry="26" fill="#FFFBF2" stroke="rgba(199,167,106,.5)" />
                <ellipse cx="160" cy="236" rx="104" ry="21" fill="none" stroke="rgba(199,167,106,.35)" strokeDasharray="1 3" />
                {t1.map((d, i) => (
                  <rect key={i} x={d.x - d.w / 2} y={d.y} width={d.w} height={d.h} rx={d.w / 2} fill="#FFFBF2" />
                ))}
                {pr.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y - 5} r="2.6" fill="#C7A76A" stroke="#E2D0A5" strokeWidth=".6" />
                ))}
                {[62, 258].map((x) => (
                  <g key={x}>
                    <circle cx={x} cy={238} r="6" fill="#FFFBF2" stroke="#E2D0A5" />
                    <circle cx={x} cy={234} r="3.4" fill="#B84A43" />
                    <path d={`M${x} 231c1-4 3-5 5-5`} stroke="#563E32" fill="none" strokeWidth=".9" />
                  </g>
                ))}
              </svg>

              <svg className="ck-layer" style={{ transform: "translateZ(28px)" }} viewBox="0 0 320 360" aria-hidden="true">
                <defs>
                  <linearGradient id="t2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#FFFDF8" />
                    <stop offset=".4" stopColor="#F6EDDD" />
                    <stop offset="1" stopColor="#DCCBB0" />
                  </linearGradient>
                </defs>
                <path d="M70 182 V230 A90 21 0 0 0 250 230 V182 Z" fill="url(#t2)" />
                <path d="M70 206 A90 21 0 0 0 250 206" fill="none" stroke="#C7A76A" strokeWidth="1.1" />
                <ellipse cx="160" cy="182" rx="90" ry="21" fill="#FFFFFF" stroke="rgba(199,167,106,.5)" />
                {t2.map((d, i) => (
                  <rect key={i} x={d.x - d.w / 2} y={d.y} width={d.w} height={d.h} rx={d.w / 2} fill="#FFFFFF" stroke="rgba(199,167,106,.25)" strokeWidth=".5" />
                ))}
                {pr2.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y + 12} r="2.1" fill="#C7A76A" />
                ))}
              </svg>

              <svg className="ck-layer" style={{ transform: "translateZ(42px)" }} viewBox="0 0 320 360" aria-hidden="true">
                <defs>
                  <linearGradient id="t3" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#8B705B" />
                    <stop offset=".4" stopColor="#6F5543" />
                    <stop offset="1" stopColor="#4A3429" />
                  </linearGradient>
                </defs>
                <path d="M100 134 V178 A60 15 0 0 0 220 178 V134 Z" fill="url(#t3)" />
                <path d="M100 156 A60 15 0 0 0 220 156" fill="none" stroke="#E2D0A5" strokeWidth=".9" opacity=".85" />
                <ellipse cx="160" cy="134" rx="60" ry="15" fill="#FFFBF2" stroke="rgba(199,167,106,.5)" />
                {t3.map((d, i) => (
                  <rect key={i} x={d.x - d.w / 2} y={d.y} width={d.w} height={d.h} rx={d.w / 2} fill="#FFFBF2" />
                ))}
              </svg>

              <svg className="ck-layer ck-candles" style={{ transform: "translateZ(64px)" }} viewBox="0 0 320 360" aria-hidden="true">
                <ellipse cx="141" cy="134" rx="22" ry="5" fill="rgba(54,38,31,.2)" />
                <ellipse cx="195" cy="134" rx="22" ry="5" fill="rgba(54,38,31,.2)" />
                {[
                  { d: D2, x: 112, fx: 18, fy: 2, i: 0 },
                  { d: D4, x: 170, fx: 27, fy: 3, i: 1 },
                ].map((c) => (
                  <g key={c.i} className="ck-digit" transform={`translate(${c.x} 72)`} style={{ ["--i" as string]: c.i }}>
                    <g className="ck-digit-in">
                      <path d={c.d} fill="none" stroke="#C9B79B" strokeWidth="11.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={c.d} fill="none" stroke="#FFFBF2" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={c.d} fill="none" stroke="#C7A76A" strokeWidth="8.5" strokeLinecap="butt" strokeDasharray="1.4 6.6" opacity=".75" />
                      <path d={`M${c.fx} ${c.fy} L${c.fx} ${c.fy - 5}`} stroke="#36261F" strokeWidth="1.4" strokeLinecap="round" />
                    </g>
                    <Flame x={c.fx} y={c.fy - 5} i={c.i} />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
        <div className="ck-stars" aria-hidden="true">
          {STARS.map(([l, t], i) => (
            <svg key={i} viewBox="-10 -10 20 20" className="ck-star" style={{ left: `${l}%`, top: `${t}%`, ["--sd" as string]: `${i * 140}ms` }}>
              <path d="M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9Z" fill="#C7A76A" />
            </svg>
          ))}
        </div>
      </div>

      <div className="ck-text col">
        {!wished ? (
          <Reveal as="p" className="h-title ck-msg" text="قبل از ادامه، یه آرزو کن..." on={phase >= 3} step={140} />
        ) : (
          <Reveal key="w" as="p" className="h-title ck-msg" text="امیدوارم قشنگ‌ترین آرزوهات برآورده بشن. ❤️" on step={110} delay={900} />
        )}
        <div className="ck-actions">
          <button type="button" className={`btn btn-dark ck-btn ${phase === 3 ? "on" : ""}`} onClick={wish} disabled={phase !== 3} tabIndex={phase === 3 ? 0 : -1}>
            آرزو کردم ✨
          </button>
          <button type="button" className={`btn ck-btn ${phase === 5 ? "on" : ""}`} onClick={next} disabled={phase !== 5} tabIndex={phase === 5 ? 0 : -1}>
            ادامه
          </button>
        </div>
      </div>
      <FxLayer engineRef={fx} max={160} />
    </section>
  );
}
