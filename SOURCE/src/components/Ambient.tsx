import { useEffect, useRef } from "react";

interface Mote { x: number; y: number; r: number; v: number; ph: number; a: number; big: boolean }

/** Quiet floating gold dust behind every scene. `level` fades it in and out (scene 10 fades it away). */
export function Ambient({ level = 1, still = false }: { level?: number; still?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lv = useRef(level);
  lv.current = level;

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0, h = 0, raf = 0, last = 0, cur = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const motes: Mote[] = Array.from({ length: 30 }, (_, i) => ({
      x: Math.random(), y: Math.random(), r: i % 7 === 0 ? 26 + Math.random() * 30 : 0.8 + Math.random() * 1.8,
      v: 0.004 + Math.random() * 0.012, ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.45, big: i % 7 === 0,
    }));
    const size = () => {
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      cur += (lv.current - cur) * Math.min(1, dt * 1.6);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        if (!still) { m.y -= m.v * dt; m.x += Math.sin(t / 2600 + m.ph) * 0.00008; if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); } }
        const px = m.x * w, py = m.y * h;
        const tw = 0.6 + 0.4 * Math.sin(t / 900 + m.ph);
        if (m.big) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, m.r);
          g.addColorStop(0, `rgba(226,208,165,${0.16 * cur})`);
          g.addColorStop(1, "rgba(226,208,165,0)");
          ctx.fillStyle = g;
          ctx.fillRect(px - m.r, py - m.r, m.r * 2, m.r * 2);
        } else {
          ctx.fillStyle = `rgba(199,167,106,${m.a * tw * cur})`;
          ctx.beginPath(); ctx.arc(px, py, m.r, 0, 6.283); ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(draw); };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [still]);

  return <canvas ref={ref} className="ambient" aria-hidden="true" />;
}
