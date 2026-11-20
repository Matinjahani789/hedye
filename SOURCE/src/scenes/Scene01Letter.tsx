import { useEffect, useState } from "react";
import { Reveal } from "../components/Reveal";
import { useFitScale, useOnce, useTimeline } from "../lib/hooks";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

/** Scene 01 — The birthday letter: envelope → flap → postcard slides out → expands → text → exits upward. */
export default function Scene01Letter({ onNext }: SceneProps) {
  const tl = useTimeline();
  const once = useOnce();
  const [phase, setPhase] = useState(0); // 0 closed · 1 flap open · 2 card slides · 3 card expands · 4 card exits
  const [text, setText] = useState(false);
  const scale = useFitScale(340, 520, 16, 96, 1.4);

  useEffect(() => {
    tl.at(1700, () => { setPhase(1); sfx.whoosh(); });
    tl.at(2900, () => setPhase(2));
    tl.at(4200, () => setPhase(3));
    tl.at(5500, () => setText(true));
    tl.at(13200, () => finish());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () =>
    once(() => {
      tl.clear();
      setPhase(4);
      tl.at(1000, onNext);
    });

  return (
    <section className="scene" aria-label="نامه‌ی تولد">
      <div className="lt-stage" style={{ transform: `scale(${scale})` }} onClick={() => text && finish()}>
        <div className="lt-glow" />
        <div className={`lt-env-wrap p${phase}`}>
          <div className="lt-shadow lt-part" />
          <div className="lt-back lt-part" />

          <div className="lt-flapbox lt-part">
            <div className="lt-flip">
              <svg className="lt-face lt-face-out" viewBox="0 0 320 112" aria-hidden="true">
                <defs>
                  <linearGradient id="fl-o" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFFDF8" />
                    <stop offset="1" stopColor="#F6F0E4" />
                  </linearGradient>
                </defs>
                <path d="M1 1 H319 L160 111 Z" fill="url(#fl-o)" stroke="#C7A76A" strokeWidth="1" strokeLinejoin="round" />
                <path d="M16 6 H304 L160 102 Z" fill="none" stroke="#E2D0A5" strokeWidth=".7" strokeLinejoin="round" />
                <g className="lt-seal">
                  <circle cx="160" cy="98" r="17" fill="#563E32" />
                  <circle cx="160" cy="98" r="13.5" fill="none" stroke="#C7A76A" strokeWidth=".9" />
                  <path d="M160 88c1 6 3 8 9 10-6 2-8 4-9 10-1-6-3-8-9-10 6-2 8-4 9-10z" fill="#E2D0A5" />
                </g>
              </svg>
              <svg className="lt-face lt-face-in" viewBox="0 0 320 112" aria-hidden="true">
                <defs>
                  <linearGradient id="lt-in-shade" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#B19A83" stopOpacity=".45" />
                    <stop offset="1" stopColor="#B19A83" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M1 111 H319 L160 1 Z" fill="#E8DECB" stroke="#C7A76A" strokeWidth=".8" strokeLinejoin="round" />
                <path d="M1 111 H319 L160 1 Z" fill="url(#lt-in-shade)" />
              </svg>
            </div>
          </div>

          <article className="lt-card" aria-live="polite">
            <div className="lt-paper">
              <svg className="lt-orn" viewBox="0 0 120 14" aria-hidden="true">
                <path d="M4 7h46M70 7h46" stroke="#C7A76A" strokeWidth=".9" />
                <path d="M60 1l4.5 6-4.5 6-4.5-6z" fill="none" stroke="#C7A76A" strokeWidth="1" />
              </svg>
              <Reveal as="h1" className="lt-title display" text="هدیه جان، تولدت مبارک! ❤️" on={text} delay={0} step={160} />
              <Reveal as="p" className="lt-l1 display" text="ان‌شاءالله ۱۲۰ ساله بشی." on={text} delay={1700} step={150} />
              <Reveal
                as="p"
                className="lt-l2 display"
                text="امیدوارم همیشه سالم، خوشحال و پر از انرژی باشی و قشنگ‌ترین اتفاق‌های زندگی همیشه منتظرت باشن."
                on={text}
                delay={3000}
                step={105}
              />
              <Reveal as="p" className="lt-l3 display" text="یه سورپرایز کوچولو هم برات دارم..." on={text} delay={5600} step={170} />
            </div>
          </article>

          <svg className="lt-front lt-part" viewBox="0 0 320 210" aria-hidden="true">
            <defs>
              <linearGradient id="lf-l" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#F3ECDD" />
                <stop offset="1" stopColor="#FAF5EA" />
              </linearGradient>
              <linearGradient id="lf-r" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0" stopColor="#EFE7D7" />
                <stop offset="1" stopColor="#F8F2E6" />
              </linearGradient>
              <linearGradient id="lf-b" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#FFFDF8" />
                <stop offset="1" stopColor="#F6F0E3" />
              </linearGradient>
            </defs>
            <path d="M0 0 L160 112 L0 210 Z" fill="url(#lf-l)" stroke="#E2D0A5" strokeWidth=".8" />
            <path d="M320 0 L160 112 L320 210 Z" fill="url(#lf-r)" stroke="#E2D0A5" strokeWidth=".8" />
            <path d="M0 210 L160 112 L320 210 Z" fill="url(#lf-b)" stroke="#E2D0A5" strokeWidth=".8" />
            <rect x=".5" y=".5" width="319" height="209" rx="4" fill="none" stroke="#C7A76A" strokeWidth="1" />
            <rect x="7" y="7" width="306" height="196" rx="2" fill="none" stroke="#E2D0A5" strokeWidth=".5" strokeDasharray="1 3" />
            <path d="M138 196h44M160 188l5 8-5 8-5-8z" fill="none" stroke="#C7A76A" strokeWidth=".8" transform="translate(0,-8)" />
          </svg>
        </div>
      </div>
    </section>
  );
}
