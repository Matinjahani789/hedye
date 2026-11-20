import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { Ambient } from "./components/Ambient";
import { prepareOffline, type OfflineResult } from "./lib/offline";
import { useReducedMotion } from "./lib/hooks";
import { sfx } from "./lib/sound";
import { verifyCalendar } from "./lib/persian";
import Scene01Letter from "./scenes/Scene01Letter";
import Scene02Question from "./scenes/Scene02Question";
import Scene03Rating from "./scenes/Scene03Rating";
import Scene04Cake from "./scenes/Scene04Cake";
import Scene05Gift from "./scenes/Scene05Gift";
import Scene06Constellation from "./scenes/Scene06Constellation";
import Scene07Celebration from "./scenes/Scene07Celebration";
import Scene08Calendar from "./scenes/Scene08Calendar";
import Scene09Gallery from "./scenes/Scene09Gallery";
import Scene10Final from "./scenes/Scene10Final";
import type { SceneProps } from "./lib/types";

interface SceneDef {
  id: string;
  C: ComponentType<SceneProps>;
  enter: string;
  leave: string;
  leaveMs: number;
}

const SCENES: SceneDef[] = [
  { id: "letter", C: Scene01Letter, enter: "en-fade", leave: "lv-fade", leaveMs: 800 },
  { id: "question", C: Scene02Question, enter: "en-rise", leave: "lv-up", leaveMs: 650 },
  { id: "rating", C: Scene03Rating, enter: "en-pop", leave: "lv-fade", leaveMs: 700 },
  { id: "cake", C: Scene04Cake, enter: "en-fade", leave: "lv-zoom", leaveMs: 800 },
  { id: "gift", C: Scene05Gift, enter: "en-rise", leave: "lv-fade", leaveMs: 800 },
  { id: "stars", C: Scene06Constellation, enter: "en-fade-slow", leave: "lv-fade", leaveMs: 900 },
  { id: "celebration", C: Scene07Celebration, enter: "en-zoom", leave: "lv-fade", leaveMs: 900 },
  { id: "calendar", C: Scene08Calendar, enter: "en-fade", leave: "lv-fade", leaveMs: 1000 },
  { id: "gallery", C: Scene09Gallery, enter: "en-fade-slow", leave: "lv-fade", leaveMs: 900 },
  { id: "final", C: Scene10Final, enter: "en-fade-slow", leave: "lv-fade", leaveMs: 600 },
];

export default function App() {
  const [idx, setIdx] = useState(() => {
    // ?scene=N lets Matin jump straight to a scene while testing
    const n = Number(new URLSearchParams(location.search).get("scene"));
    return n >= 1 && n <= SCENES.length ? n - 1 : 0;
  });
  const [run, setRun] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [sound, setSound] = useState(false);
  const [offline, setOffline] = useState<OfflineResult>({ status: "idle", missing: [] });
  const [showBadge, setShowBadge] = useState(false);
  const rm = useReducedMotion();

  const idxRef = useRef(0);
  const lock = useRef(false);
  const timer = useRef<number>(0);
  idxRef.current = idx;

  /** Central scene controller: one transition at a time, always completes, ignores stale/duplicate calls. */
  const go = useCallback(
    (from: number) => {
      if (from !== idxRef.current || lock.current || from >= SCENES.length - 1) return;
      lock.current = true;
      setLeaving(true);
      const ms = rm ? 120 : SCENES[from].leaveMs;
      timer.current = window.setTimeout(() => {
        setIdx(from + 1);
        setLeaving(false);
        lock.current = false;
      }, ms);
    },
    [rm]
  );

  const replay = useCallback(() => {
    clearTimeout(timer.current);
    lock.current = false;
    setLeaving(false);
    setIdx(0);
    setRun((r) => r + 1);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Backgrounded tab → pause CSS animations too
  useEffect(() => {
    const on = () => (document.documentElement.dataset.hidden = document.hidden ? "1" : "0");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  // Offline preparation (first online visit)
  const prepare = useCallback(async () => {
    setOffline({ status: "preparing", missing: [] });
    const r = await prepareOffline();
    setOffline(r);
    if (r.status === "ready" || r.status === "error") setShowBadge(true);
  }, []);
  useEffect(() => {
    const id = window.setTimeout(prepare, 1800);
    return () => clearTimeout(id);
  }, [prepare]);
  useEffect(() => {
    if (offline.status !== "ready" || !showBadge) return;
    const id = window.setTimeout(() => setShowBadge(false), 4800);
    return () => clearTimeout(id);
  }, [offline.status, showBadge]);

  useEffect(() => {
    if (import.meta.env.DEV && !verifyCalendar()) console.error("Calendar self-check failed");
  }, []);

  const def = SCENES[idx];
  const C = def.C;

  return (
    <div className="app" data-scene={def.id}>
      <Ambient level={idx === 9 ? 0.0 : 1} still={rm} />
      <div key={`${run}-${idx}`} className={`scene-root ${leaving ? def.leave : def.enter}`} style={{ pointerEvents: leaving ? "none" : undefined, ["--lv" as string]: `${def.leaveMs}ms` }}>
        <C onNext={() => go(idx)} onReplay={replay} active={!leaving} />
      </div>

      <div className="progress" aria-hidden="true">
        {SCENES.map((s, i) => (
          <i key={s.id} className={i < idx ? "done" : i === idx ? "now" : ""} />
        ))}
      </div>

      <button
        type="button"
        className="sound-toggle"
        aria-pressed={sound}
        aria-label={sound ? "قطع صدا" : "پخش صدا"}
        onClick={() => {
          const next = !sound;
          sfx.setEnabled(next);
          setSound(next && sfx.enabled);
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
          {sound ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
        </svg>
      </button>

      {showBadge && offline.status === "ready" && (
        <div className="offline-badge" role="status">
          همه‌چیز برای تماشای آفلاین آماده است. ✨
        </div>
      )}
      {showBadge && offline.status === "error" && (
        <div className="offline-badge is-error" role="alert">
          <span>آماده‌سازی آفلاین کامل نشد{offline.missing.length ? ` (${offline.missing.length} فایل)` : ""}.</span>
          <button type="button" onClick={prepare}>
            تلاش دوباره
          </button>
        </div>
      )}
    </div>
  );
}
