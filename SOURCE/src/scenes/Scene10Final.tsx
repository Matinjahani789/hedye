import { useEffect, useState } from "react";
import { Reveal } from "../components/Reveal";
import { useOnce, useTimeline } from "../lib/hooks";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

/** Scene 10 — the final message and Matin's signature, with a quiet replay control. */
export default function Scene10Final({ onReplay }: SceneProps) {
  const tl = useTimeline();
  const once = useOnce();
  const [msg, setMsg] = useState(false);
  const [sign, setSign] = useState(false);
  const [rep, setRep] = useState(false);

  useEffect(() => {
    tl.at(1200, () => setMsg(true));
    tl.at(6600, () => setSign(true));
    tl.at(11800, () => setRep(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="scene fn-scene" aria-label="پیام پایانی">
      <div className="fn-inner">
        <h1 className="fn-msg">
          <Reveal text="هدیه جان،" on={msg} step={200} />
          <Reveal text="همیشه بخند و همیشه شاد باش. ❤️" on={msg} delay={1000} step={230} />
        </h1>
        <div className={`fn-sign ${sign ? "on" : ""}`}>
          <p className="fn-from">از طرف داداشت،</p>
          <p className="fn-name">متین</p>
          <span className="fn-line" aria-hidden="true" />
        </div>
      </div>
      <button
        type="button"
        className={`btn btn-ghost fn-replay ${rep ? "on" : ""}`}
        onClick={() => { sfx.tap(); once(onReplay); }}
        disabled={!rep}
        aria-label="پخش دوباره"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4h4" />
        </svg>
        دوباره ببین
      </button>
    </section>
  );
}
