import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePageVisible, useTimeline, useViewport } from "../lib/hooks";
import { toFa } from "../lib/persian";
import { loadAllPhotos, saveDevicePhotos, type PhotoItem } from "../lib/photos";
import { sfx } from "../lib/sound";
import type { SceneProps } from "../lib/types";

/* ---------- 3D poses ---------- */
interface Pose { x: number; y: number; z: number; rz: number; ry: number; s: number; o: number }
const T = (p: Pose, dx = 0) => `translate3d(calc(${p.x}% + ${dx}px), ${p.y}%, ${p.z}px) rotateZ(${p.rz}deg) rotateY(${p.ry}deg) scale(${p.s})`;
const P = (x = 0, y = 0, z = 0, rz = 0, ry = 0, s = 1, o = 1): Pose => ({ x, y, z, rz, ry, s, o });

/** rel = index offset from the centre card. +1 (next) sits on the left — natural for RTL. */
function pose(rel: number): Pose {
  const a = Math.abs(rel);
  if (a === 0) return P();
  const s = -Math.sign(rel);
  if (a === 1) return P(s * 62, 0, -140, 0, -s * 34, 0.86, 0.62);
  return P(s * 90, 0, -320, 0, -s * 50, 0.7, 0);
}
const rel = (i: number, c: number, n: number) => {
  let d = (((i - c) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
};

type Kf = Keyframe & { offset?: number };
const frame = (p: Pose, extra: Partial<Kf> = {}, dx = 0): Kf => ({ transform: T(p, dx), opacity: p.o, ...extra });

/** Five consistent photographic transitions. */
function keyframesFor(type: number, role: "leave" | "enter" | "other", dir: number, from: Pose, to: Pose, dx: number): { kf: Kf[]; ms: number } {
  const sx = dir;
  const base: Kf[] = [frame(from, {}, dx), frame(to)];
  if (role === "other") return { kf: base, ms: 900 };
  switch (type) {
    case 0: // 3D horizontal card flip
      return role === "leave"
        ? { ms: 1100, kf: [frame(P(), { offset: 0 }), frame(P(0, 0, 50, 0, dir * 90, 1, 1), { offset: 0.5 }), frame(to, { offset: 0.52, opacity: 0 }), frame(to, { offset: 1 })] }
        : { ms: 1100, kf: [frame(from, { offset: 0 }), frame(from, { offset: 0.38, opacity: 0 }), frame(P(0, 0, 50, 0, -dir * 90, 1, 0), { offset: 0.5 }), frame(P(0, 0, 30, 0, -dir * 60, 1, 1), { offset: 0.56 }), frame(P(), { offset: 1 })] };
    case 1: // perspective card slide
      return { ms: 900, kf: base };
    case 2: // gentle rotation + depth
      return role === "leave"
        ? { ms: 1000, kf: [frame(P()), frame(P(sx * 38, -3, -240, sx * 7, -sx * 24, 0.9, 0.8), { offset: 0.5 }), frame(to)] }
        : { ms: 1000, kf: [frame(from, {}, dx), frame(P(-sx * 20, 0, -200, -sx * 5, sx * 16, 0.9, 0.85), { offset: 0.5 }), frame(P())] };
    case 3: // stacked photo
      return role === "leave"
        ? { ms: 1050, kf: [frame(P(), { zIndex: 3 }), frame(P(sx * 24, -5, 60, sx * 5, 0, 1.02, 1), { offset: 0.35, zIndex: 4 }), frame(P(sx * 10, 2, -180, -sx * 2, 0, 0.88, 0.9), { offset: 0.7, zIndex: 1 }), frame(to, { zIndex: 2 })] }
        : { ms: 1050, kf: [frame(from, {}, dx), frame(P(0, 2, -100, 0, 0, 0.93, 0.9), { offset: 0.45 }), frame(P())] };
    default: // overlapping reveal
      return role === "leave"
        ? { ms: 1000, kf: [frame(P(), { zIndex: 3 }), frame(P(sx * 72, 0, -40, 0, -sx * 18, 0.96, 1), { offset: 0.55, zIndex: 3 }), frame(to, { zIndex: 2 })] }
        : { ms: 1000, kf: [frame(from, { zIndex: 2 }, dx), frame(P(0, 0, -50, 0, 0, 0.92, 1), { offset: 0.5, zIndex: 2 }), frame(P(), { zIndex: 2 })] };
  }
}

interface NavInfo { from: number; to: number; dir: number; type: number; dx: number }

/** Scene 09 — the personal photo exhibition. */
export default function Scene09Gallery({ onNext }: SceneProps) {
  const tl = useTimeline();
  const visible = usePageVisible();
  const { w, h } = useViewport();
  const [photos, setPhotos] = useState<PhotoItem[] | null>(null);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [idx, setIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [snap, setSnap] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [pickMsg, setPickMsg] = useState("");

  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<Record<string, HTMLDivElement | null>>({});
  const nav = useRef<NavInfo | null>(null);
  const navCount = useRef(0);
  const urls = useRef<string[]>([]);
  const drag = useRef({ id: -1, x0: 0, t0: 0, moved: false });
  const doneRef = useRef(false);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  const list = useMemo(() => (photos ?? []).filter((p) => !bad.has(p.id)), [photos, bad]);
  const n = list.length;

  /* ---- load photographs (manifest + device) ---- */
  const load = useCallback(async () => {
    const all = await loadAllPhotos();
    urls.current.filter((u) => u.startsWith("blob:")).forEach((u) => URL.revokeObjectURL(u));
    urls.current = all.map((p) => p.src);
    setBad(new Set());
    setIdx(0);
    setPhotos(all);
  }, []);
  useEffect(() => {
    void load();
    return () => urls.current.filter((u) => u.startsWith("blob:")).forEach((u) => URL.revokeObjectURL(u));
  }, [load]);

  useEffect(() => { if (n && idx > n - 1) setIdx(n - 1); }, [n, idx]);

  /* ---- preload neighbours ---- */
  useEffect(() => {
    if (!n) return;
    [1, -1, 2].forEach((d) => {
      const p = list[(((idx + d) % n) + n) % n];
      if (p) { const im = new Image(); im.decoding = "async"; im.src = p.src; }
    });
  }, [idx, list, n]);

  /* ---- navigation ---- */
  const go = useCallback((dir: number, type?: number, dx = 0) => {
    if (n < 2 || exiting || doneRef.current) return;
    stage.current?.getAnimations({ subtree: true }).forEach((a) => a.cancel()); // finish/cancel the previous move cleanly
    const t = type ?? navCount.current++ % 5;
    const to = (((idx + dir) % n) + n) % n;
    nav.current = { from: idx, to, dir, type: t, dx };
    setSnap(false);
    setDragX(0);
    setIdx(to);
    sfx.flip();
  }, [idx, n, exiting]);

  useLayoutEffect(() => {
    const nv = nav.current;
    if (!nv || tl.rm) { nav.current = null; return; }
    nav.current = null;
    list.forEach((p, i) => {
      const el = cards.current[p.id];
      if (!el) return;
      const o = rel(i, nv.from, n), nw = rel(i, nv.to, n);
      if (Math.abs(o) > 2 && Math.abs(nw) > 2) return;
      const role = o === 0 ? "leave" : nw === 0 ? "enter" : "other";
      const { kf, ms } = keyframesFor(nv.type, role, nv.dir, pose(o), pose(nw), nv.dx);
      el.animate(kf, { duration: ms, easing: "cubic-bezier(.45,.05,.25,1)", fill: "none" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  /* ---- finish → scene 10 (photo recedes, neighbours vanish) ---- */
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stage.current?.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    setExiting(true);
    tl.at(1700, () => nextRef.current());
  }, [tl]);

  /* ---- 5 s autoplay (paused while dragging / hidden) ---- */
  useEffect(() => {
    if (photos === null || n === 0 || dragging || exiting || !visible) return;
    const id = window.setTimeout(() => (idx >= n - 1 ? finish() : go(1)), 5000);
    return () => clearTimeout(id);
  }, [idx, n, photos, dragging, exiting, visible, go, finish]);

  /* ---- keyboard (RTL: ← = next, → = previous) ---- */
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [go]);

  /* ---- drag / swipe (finger moving right → next, as in an RTL pager) ---- */
  const cw = Math.round(Math.max(150, Math.min(w * 0.74, 380, ((h < 520 ? h - 130 : h - 270)) * 0.8)));
  const onDown = (e: React.PointerEvent) => {
    if (n < 2 || exiting) return;
    drag.current = { id: e.pointerId, x0: e.clientX, t0: performance.now(), moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    stage.current?.getAnimations({ subtree: true }).forEach((a) => a.finish());
    setDragging(true);
    setSnap(false);
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag.current.id !== e.pointerId) return;
    const dx = Math.max(-cw, Math.min(cw, e.clientX - drag.current.x0));
    if (Math.abs(dx) > 4) drag.current.moved = true;
    setDragX(dx);
  };
  const onUp = (e: React.PointerEvent) => {
    if (drag.current.id !== e.pointerId) return;
    drag.current.id = -1;
    setDragging(false);
    const dx = dragX;
    const v = Math.abs(dx) / Math.max(1, performance.now() - drag.current.t0);
    if (Math.abs(dx) > cw * 0.16 || (v > 0.45 && Math.abs(dx) > 24)) {
      go(dx > 0 ? 1 : -1, 1, dx);
    } else {
      setSnap(true);
      setDragX(0);
      tl.at(500, () => setSnap(false));
    }
  };

  /* ---- device photo picker (fallback) ---- */
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const r = await saveDevicePhotos(Array.from(files));
    if (r.error) setPickMsg(r.error);
    else { setPickMsg(""); await load(); }
  };

  const showDev = import.meta.env.DEV || new URLSearchParams(location.search).has("setup");
  const centerId = list[idx]?.id;

  /* ================= empty state ================= */
  if (photos !== null && n === 0) {
    return (
      <section className="scene gl-scene gl-empty" aria-label="گالری عکس">
        <div className="col">
          <div className="gl-ghosts" aria-hidden="true">
            {[-1, 0, 1].map((k) => (
              <div key={k} className={`gl-ghost g${k}`}><i /><i /><i /><i /></div>
            ))}
          </div>
          <h1 className="h-title" style={{ marginTop: 26 }}>اینجا جای عکس‌های توئه</h1>
          <p className="h-sub">عکس‌های هدیه به‌زودی توی این قاب‌ها جا می‌گیرن.</p>
          {showDev && (
            <p className="gl-dev" dir="ltr">
              Matin → put photos in <b>photos/</b>, run <code>node scripts/index-photos.mjs</code>, then rebuild.
            </p>
          )}
          <label className="btn gl-pick">
            انتخاب عکس از گوشی
            <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.avif" multiple onChange={(e) => void pick(e.target.files)} hidden />
          </label>
          {pickMsg && <p className="gl-msg" role="alert">{pickMsg}</p>}
          <button type="button" className="btn btn-dark" style={{ marginTop: 14 }} onClick={() => { sfx.tap(); onNext(); }}>ادامه</button>
        </div>
      </section>
    );
  }

  return (
    <section className={`scene gl-scene ${exiting ? "gl-exit" : ""}`} aria-label="گالری عکس" style={{ ["--cw" as string]: `${cw}px` }}>
      <div
        className={`gl-stage ${snap ? "gl-snap" : ""} ${dragging ? "gl-dragging" : ""}`}
        ref={stage}
        style={{ height: Math.round(cw * 1.25) + 30 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="group"
        aria-roledescription="carousel"
        aria-label="عکس‌ها"
      >
        {photos === null && <div className="gl-loading">…</div>}
        {list.map((p, i) => {
          const r = rel(i, idx, n || 1);
          if (Math.abs(r) > 2) return null;
          const ps = pose(r);
          const ratio = ratios[p.id];
          const cover = ratio ? Math.abs(ratio / 0.8 - 1) < 0.2 : false;
          const style: React.CSSProperties = exiting
            ? r === 0
              ? { transform: T(P(0, -2, -520, 0, 0, 0.7, 0)), opacity: 0, zIndex: 3, transition: "transform 1.6s cubic-bezier(.45,.05,.25,1), opacity 1.3s ease .2s" }
              : { transform: T(ps), opacity: 0, zIndex: 2, transition: "opacity .7s ease" }
            : { transform: T(ps, dragging || snap ? dragX : 0), opacity: ps.o, zIndex: r === 0 ? 3 : 2 };
          return (
            <div
              key={p.id}
              ref={(el) => { cards.current[p.id] = el; }}
              className={`gl-card ${r === 0 ? "cur" : ""}`}
              style={style}
              aria-hidden={r !== 0}
            >
              <div className="gl-paper">
                <div className={`gl-img ${loaded[p.id] ? "ok" : ""}`}>
                  <img
                    src={p.src}
                    alt={r === 0 ? `عکس ${toFa(i + 1)}` : ""}
                    draggable={false}
                    decoding="async"
                    style={{ objectFit: cover ? "cover" : "contain", objectPosition: cover ? "50% 32%" : "50% 50%" }}
                    onLoad={(e) => {
                      const im = e.currentTarget;
                      setRatios((m) => ({ ...m, [p.id]: im.naturalWidth / Math.max(1, im.naturalHeight) }));
                      setLoaded((m) => ({ ...m, [p.id]: true }));
                    }}
                    onError={() => setBad((b) => new Set(b).add(p.id))}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`gl-bar ${exiting ? "off" : ""}`}>
        <button type="button" className="gl-nav" onClick={() => go(-1)} aria-label="قبلی" disabled={n < 2}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <div className="gl-pos" aria-live="polite">
          {n > 0 && n <= 12 ? (
            <div className="gl-dots">
              {list.map((p, i) => <i key={p.id} className={i === idx ? "on" : ""} />)}
            </div>
          ) : (
            <div className="gl-line"><i style={{ width: `${n ? ((idx + 1) / n) * 100 : 0}%` }} /></div>
          )}
          <span className="gl-count num">{toFa(Math.min(idx + 1, n))} / {toFa(n)}</span>
        </div>
        <button type="button" className="gl-nav" onClick={() => go(1)} aria-label="بعدی" disabled={n < 2}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      </div>
      <button type="button" className={`btn btn-ghost gl-skip ${exiting ? "off" : ""}`} onClick={() => { sfx.tap(); finish(); }}>
        ادامه
      </button>
      <span className="sr-only">{centerId}</span>
    </section>
  );
}
