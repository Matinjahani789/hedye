import { useEffect, useRef, useState } from "react";
import { FxLayer } from "../components/FxLayer";
import { Reveal } from "../components/Reveal";
import type { ConfettiEngine } from "../lib/confetti";
import { useOnce, useTimeline, useViewport } from "../lib/hooks";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

const CARDS = [
  { front: "یه آرزوی قشنگ", back: "امیدوارم همیشه دلت پر از آرامش و خوشحالی باشه." },
  { front: "یه آرزوی دیگه", back: "امیدوارم هر روز به چیزهایی که دوست داری نزدیک‌تر بشی." },
  { front: "و مهم‌تر از همه...", back: "امیدوارم همیشه دلیل‌های زیادی برای لبخند زدن داشته باشی." },
];

const Rib = () => <i className="gb-rib" />;

/** Scene 05 — a real CSS-3D gift box: ribbon unwraps, bow lifts away, lid hinges open, three flip cards emerge. */
export default function Scene05Gift({ onNext }: SceneProps) {
  const tl = useTimeline();
  const onceOpen = useOnce();
  const onceNext = useOnce();
  const fx = useRef<ConfettiEngine | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLElement>(null);
  const { w, h } = useViewport();

  const [ready, setReady] = useState(false);
  const [un, setUn] = useState(false);
  const [open, setOpen] = useState(false);
  const [lit, setLit] = useState(false);
  const [compact, setCompact] = useState(false);
  const [cardsIn, setCardsIn] = useState(0);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    tl.at(1800, () => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardH = Math.round(Math.min(92, Math.max(64, h * 0.105)));
  const zonePre = Math.round(Math.min(340, Math.max(200, h * 0.46)));
  const zonePost = Math.round(Math.min(190, Math.max(70, h - (110 + cardH * 3 + 20 + 80 + 90))));
  const zoneH = compact ? zonePost : zonePre;
  const s = Math.min(zoneH / 300, (w - 24) / 290);

  const openBox = () => {
    onceOpen(() => {
      sfx.whoosh();
      setUn(true);
      tl.at(1800, () => setOpen(true));
      tl.at(3000, () => {
        setLit(true);
        sfx.chime();
        const z = zone.current?.getBoundingClientRect();
        const hh = host.current?.getBoundingClientRect();
        if (z && hh) {
          const x = z.left - hh.left + z.width / 2;
          const y = z.top - hh.top + z.height * 0.45;
          fx.current?.rise(x, y, 90, 40);
          tl.at(700, () => fx.current?.rise(x, y, 120, 30));
        }
      });
      tl.at(3600, () => setCompact(true));
      [0, 1, 2].forEach((i) => tl.at(4300 + i * 650, () => { setCardsIn(i + 1); sfx.pop(); }));
    });
  };

  const flip = (i: number) => {
    if (cardsIn <= i) return;
    sfx.tap();
    setFlipped((f) => {
      if (f[i]) return f;
      const n = f.slice();
      n[i] = true;
      if (n.every(Boolean)) {
        tl.at(1300, () => { setDone(true); sfx.chime(); fx.current?.rise((host.current?.clientWidth ?? 300) / 2, (host.current?.clientHeight ?? 500) * 0.4, 160, 28); });
      }
      return n;
    });
  };

  const next = () => { sfx.tap(); onceNext(onNext); };
  const seen = flipped.filter(Boolean).length;

  return (
    <section className="scene gb-scene" ref={host} aria-label="کادو">
      <div className="col gb-head">
        {done ? (
          <Reveal key="d" as="h1" className="h-title" text="اینم از سه تا آرزوی کوچولوی من برای تو. ❤️" on step={110} />
        ) : compact ? (
          <Reveal key="c" as="h1" className="h-title" text={seen ? "هنوز بعضی‌هاش مونده..." : "روی کارت‌ها بزن"} on={cardsIn > 0} step={110} />
        ) : (
          <Reveal key="a" as="h1" className="h-title" text="یه کادوی دیگه هم برات دارم..." on delay={500} step={140} />
        )}
      </div>

      <div className="gb-zone" ref={zone} style={{ height: zoneH }}>
        <div className="gb-fit" style={{ transform: `scale(${s})` }}>
          <div className={`gb-world ${un ? "gb-un" : ""} ${open ? "gb-open" : ""} ${lit ? "gb-lit" : ""}`}>
            <div className="gb-shadow" />

            <div className="gb-body">
              <div className="gb-f gb-front"><Rib /></div>
              <div className="gb-f gb-back"><Rib /></div>
              <div className="gb-f gb-right"><Rib /></div>
              <div className="gb-f gb-left"><Rib /></div>
              <div className="gb-f gb-bottom" />
              <div className="gb-in gb-in-back" />
              <div className="gb-in gb-in-left" />
              <div className="gb-in gb-in-right" />
              <div className="gb-in gb-in-floor" />
              <div className="gb-glow" />
            </div>

            <div className="gb-hinge">
              <div className="gb-lid">
                <div className="gb-f gb-front"><Rib /></div>
                <div className="gb-f gb-back"><Rib /></div>
                <div className="gb-f gb-right"><Rib /></div>
                <div className="gb-f gb-left"><Rib /></div>
                <div className="gb-f gb-top"><i className="gb-rib" /><i className="gb-rib gb-rib-x" /></div>
                <div className="gb-f gb-under" />
              </div>
            </div>

            <div className="gb-beam" />
            <svg className="gb-bow" viewBox="0 0 120 80" aria-hidden="true">
              <defs>
                <linearGradient id="bw" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#7A5D4B" />
                  <stop offset="1" stopColor="#4A3329" />
                </linearGradient>
              </defs>
              <path d="M56 66 L36 78 L50 76 L58 70Z M64 66 L84 78 L70 76 L62 70Z" fill="#563E32" stroke="#C7A76A" strokeWidth=".7" />
              <path d="M60 62 C40 18 4 16 12 46 C18 68 46 70 60 62Z" fill="url(#bw)" stroke="#C7A76A" strokeWidth=".9" />
              <path d="M60 62 C80 18 116 16 108 46 C102 68 74 70 60 62Z" fill="url(#bw)" stroke="#C7A76A" strokeWidth=".9" />
              <path d="M56 58 C42 34 24 30 20 44 M64 58 C78 34 96 30 100 44" fill="none" stroke="#E2D0A5" strokeWidth=".7" opacity=".7" />
              <rect x="51" y="54" width="18" height="16" rx="4" fill="#563E32" stroke="#C7A76A" strokeWidth=".9" />
            </svg>
          </div>
        </div>
      </div>

      <div className="gb-cards" style={{ ["--ch" as string]: `${cardH}px` }}>
        {CARDS.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`wc ${cardsIn > i ? "in" : ""} ${flipped[i] ? "flipped" : ""}`}
            onClick={() => flip(i)}
            aria-pressed={flipped[i]}
            tabIndex={cardsIn > i ? 0 : -1}
          >
            <span className="wc-inner">
              <span className="wc-face wc-front">
                <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M6 0l3 6-3 6-3-6z" fill="none" stroke="#C7A76A" /></svg>
                <b className="display">{c.front}</b>
              </span>
              <span className="wc-face wc-back display">{c.back}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="gb-actions">
        <button type="button" className={`btn btn-dark gb-btn ${ready && !un ? "on" : ""}`} onClick={openBox} disabled={!ready || un}>
          بازش کن
        </button>
        <button type="button" className={`btn gb-btn ${done ? "on" : ""}`} onClick={next} disabled={!done}>
          ادامه
        </button>
      </div>
      <FxLayer engineRef={fx} max={140} />
    </section>
  );
}
