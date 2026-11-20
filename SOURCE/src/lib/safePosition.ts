// Collision-aware placement used by the escaping buttons (scenes 02 & 03).

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const boxOf = (r: DOMRect | Box): Box => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });

const inflate = (b: Box, m: number): Box => ({ left: b.left - m, top: b.top - m, right: b.right + m, bottom: b.bottom + m });
const hit = (a: Box, b: Box) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Inner (padding-excluded) area of an element, clipped to the visual viewport. */
export function playBounds(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const vv = window.visualViewport;
  const vw = vv?.width ?? window.innerWidth;
  const vh = vv?.height ?? window.innerHeight;
  return {
    left: Math.max(0, r.left + parseFloat(cs.paddingLeft || "0")),
    top: Math.max(0, r.top + parseFloat(cs.paddingTop || "0")),
    right: Math.min(vw, r.right - parseFloat(cs.paddingRight || "0")),
    bottom: Math.min(vh, r.bottom - parseFloat(cs.paddingBottom || "0")),
  };
}

export interface SpotOptions {
  bounds: Box;
  size: { w: number; h: number };
  /** things we must never overlap (headline, the correct answer …) */
  hard: Box[];
  /** things we prefer not to overlap (other buttons) */
  soft?: Box[];
  /** where the finger is: don't land under it */
  avoid?: { x: number; y: number; r: number };
  from?: Box;
  minTravel?: number;
  margin?: number;
  step?: number;
}

/** Returns the new top-left (viewport coordinates) of a safe rect. */
export function findSafeSpot(o: SpotOptions): { left: number; top: number } {
  const { bounds, size, hard, soft = [], avoid, from, minTravel = 0, margin = 10, step = 8 } = o;
  const maxL = bounds.right - size.w;
  const maxT = bounds.bottom - size.h;
  const hardI = hard.map((b) => inflate(b, margin));
  const softI = soft.map((b) => inflate(b, margin * 0.6));
  const fromC = from ? { x: (from.left + from.right) / 2, y: (from.top + from.bottom) / 2 } : null;

  const tiers = [
    { useSoft: true, travel: minTravel, useAvoid: true },
    { useSoft: true, travel: minTravel * 0.5, useAvoid: true },
    { useSoft: false, travel: minTravel * 0.5, useAvoid: true },
    { useSoft: false, travel: 0, useAvoid: false },
  ];

  for (const t of tiers) {
    const ok: { left: number; top: number; score: number }[] = [];
    for (let top = bounds.top; top <= maxT; top += step) {
      for (let left = bounds.left; left <= maxL; left += step) {
        const c: Box = { left, top, right: left + size.w, bottom: top + size.h };
        if (hardI.some((h) => hit(c, h))) continue;
        if (t.useSoft && softI.some((s) => hit(c, s))) continue;
        const cx = left + size.w / 2;
        const cy = top + size.h / 2;
        if (t.useAvoid && avoid && Math.hypot(cx - avoid.x, cy - avoid.y) < avoid.r) continue;
        let dist = 0;
        if (fromC) {
          dist = Math.hypot(cx - fromC.x, cy - fromC.y);
          if (dist < t.travel) continue;
        }
        ok.push({ left, top, score: dist });
      }
    }
    if (ok.length) {
      // random among the farther half → surprising but never trivial
      ok.sort((a, b) => b.score - a.score);
      const pool = ok.slice(0, Math.max(1, Math.ceil(ok.length * 0.5)));
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return { left: pick.left, top: pick.top };
    }
  }
  return from ? { left: from.left, top: from.top } : { left: bounds.left, top: bounds.top };
}
