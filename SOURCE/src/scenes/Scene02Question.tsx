import { useCallback, useEffect, useRef, useState } from "react";
import { useOnce, useTimeline } from "../lib/hooks";
import { boxOf, findSafeSpot, playBounds } from "../lib/safePosition";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

/** Scene 02 — «کادوی کی از همه بهتر بود؟» : the "دیگران" button escapes exactly three times, then becomes «من». */
export default function Scene02Question({ onNext }: SceneProps) {
  const tl = useTimeline();
  const once = useOnce();
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const mine = useRef<HTMLButtonElement>(null);
  const question = useRef<HTMLHeadingElement>(null);
  const note = useRef<HTMLParagraphElement>(null);

  const [escapes, setEscapes] = useState(0);
  const [label, setLabel] = useState("دیگران");
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [note3, setNote3] = useState(false);
  const busy = useRef(false);
  const lastTap = useRef<{ x: number; y: number } | undefined>(undefined);

  const place = useCallback((avoid?: { x: number; y: number }) => {
    const s = stage.current, sl = slot.current, b = btn.current;
    if (!s || !sl || !b) return;
    const bounds = playBounds(s);
    const cur = b.getBoundingClientRect();
    const base = sl.getBoundingClientRect();
    const hard = [question.current, mine.current, note.current].filter(Boolean).map((e) => boxOf(e!.getBoundingClientRect()));
    const spot = findSafeSpot({
      bounds,
      size: { w: b.offsetWidth, h: b.offsetHeight },
      hard,
      from: boxOf(cur),
      minTravel: Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top) * 0.35,
      avoid: avoid ? { ...avoid, r: 110 } : undefined,
      margin: 14,
    });
    setOff({ x: spot.left - base.left, y: spot.top - base.top });
  }, []);

  // keep the escaped button inside the screen after rotation / resize
  useEffect(() => {
    const on = () => escapes > 0 && place();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [escapes, place]);

  const onOthers = (e: React.MouseEvent) => {
    sfx.tap();
    if (escapes >= 3) return void once(onNext);
    if (busy.current) return;
    busy.current = true;
    tl.at(560, () => (busy.current = false));
    lastTap.current = { x: e.clientX, y: e.clientY };
    place(e.clientX || e.clientY ? lastTap.current : undefined);
    const n = escapes + 1;
    setEscapes(n);
    if (n === 3) {
      tl.at(250, () => { setNote3(true); sfx.pop(); });
      tl.at(480, () => setLabel("من"));
    }
  };

  const goMine = () => { sfx.tap(); once(onNext); };

  return (
    <section className="scene q-scene" ref={stage} aria-label="سؤال">
      <div className="col q-col">
        <p className="kicker">یه سؤال خیلی مهم</p>
        <h1 ref={question} className="h-title q-title">کادوی کی از همه بهتر بود؟</h1>
        <div className="gold-rule" style={{ margin: "14px auto 26px" }} />
        <div className="q-row">
          <div className="q-slot" ref={slot}>
            <button
              ref={btn}
              type="button"
              className={`btn q-btn ${escapes > 0 ? "is-moved" : ""} ${escapes >= 3 && label === "من" ? "is-final" : ""}`}
              style={{ transform: `translate(${off.x}px, ${off.y}px)` }}
              onClick={onOthers}
            >
              {label}
            </button>
          </div>
          <div className="q-slot">
            <button ref={mine} type="button" className="btn btn-dark q-btn" onClick={goMine}>
              من
            </button>
          </div>
        </div>
        <p ref={note} className={`q-note display ${note3 ? "on" : ""}`} aria-live="polite">
          خودت خواستی! 😏
        </p>
      </div>
    </section>
  );
}
