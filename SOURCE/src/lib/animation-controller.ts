// Small, cancellable rAF tween used where a CSS transition cannot express the motion
// (e.g. the constellation morphing into the number 24).

export const ease = {
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

export function tween(duration: number, fn: (t: number) => void, easing: (t: number) => number = ease.inOutCubic, done?: () => void) {
  let raf = 0;
  let start = 0;
  let stopped = false;
  const step = (now: number) => {
    if (stopped) return;
    if (!start) start = now;
    const p = Math.min(1, (now - start) / duration);
    fn(easing(p));
    if (p < 1) raf = requestAnimationFrame(step);
    else done?.();
  };
  raf = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
