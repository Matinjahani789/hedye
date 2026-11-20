// Efficient single-canvas particle engine: paper confetti, rising gold dust, sparkles, light waves.
import { rand } from "./animation-controller";

type Shape = "rect" | "strip" | "circle" | "poly" | "dust" | "spark";

interface P {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number;
  rot: number; vr: number;
  flip: number; vf: number;
  shape: Shape; color: string; depth: number;
  gravity: number; drag: number; sway: number; swayF: number;
  age: number; life: number; alpha: number;
  poly?: number[];
}

const PAPER = ["#C7A76A", "#E2D0A5", "#563E32", "#806653", "#B19A83", "#F1E9DB", "#FFFFFF", "#36261F", "#C7A76A", "#E2D0A5", "#B84A43"];
const GOLD = ["#C7A76A", "#E2D0A5", "#D9BE82"];

export interface BurstOptions {
  x: number; y: number; count: number;
  power?: number; spread?: number; angle?: number; // angle: radians, -PI/2 = up
  gold?: boolean;
}

export class ConfettiEngine {
  private ctx: CanvasRenderingContext2D;
  private ps: P[] = [];
  private raf = 0;
  private last = 0;
  private dpr = 1;
  private running = false;
  private ro: ResizeObserver;
  private onVis = () => (document.hidden ? this.halt() : this.ps.length && this.kick());
  w = 0; h = 0;
  maxParticles: number;

  constructor(private canvas: HTMLCanvasElement, maxParticles = 420) {
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.maxParticles = maxParticles;
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    document.addEventListener("visibilitychange", this.onVis);
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
  }

  private push(p: P) {
    if (this.ps.length >= this.maxParticles) this.ps.shift();
    this.ps.push(p);
  }

  /** Paper celebration burst — several shapes, depth layers, drift, flutter. */
  burst(o: BurstOptions) {
    const { x, y, count, power = 1, spread = Math.PI * 1.1, angle = -Math.PI / 2 } = o;
    const scale = Math.min(1.2, Math.max(0.7, this.w / 420));
    for (let i = 0; i < count; i++) {
      const depth = rand(0.55, 1.35);
      const a = angle + rand(-spread / 2, spread / 2);
      const sp = rand(380, 980) * power * (0.7 + depth * 0.35) * scale;
      const r = Math.random();
      const shape: Shape = r < 0.34 ? "rect" : r < 0.56 ? "strip" : r < 0.76 ? "circle" : "poly";
      const base = rand(6, 12) * depth * scale;
      const p: P = {
        x: x + rand(-18, 18), y: y + rand(-10, 10),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        w: shape === "strip" ? base * 0.38 : base,
        h: shape === "strip" ? base * 2.6 : shape === "circle" ? base * 0.8 : base * rand(0.55, 1.2),
        rot: rand(0, Math.PI * 2), vr: rand(-9, 9) * (1.3 - depth * 0.5),
        flip: rand(0, 6.28), vf: rand(3, 11),
        shape,
        color: o.gold ? GOLD[(Math.random() * GOLD.length) | 0] : PAPER[(Math.random() * PAPER.length) | 0],
        depth,
        gravity: rand(420, 620) * (0.55 + depth * 0.45) * scale,
        drag: rand(1.3, 2.4),
        sway: rand(20, 90) * depth, swayF: rand(1.2, 3.4),
        age: -rand(0, 0.25), life: rand(5.5, 8.5), alpha: 1,
      };
      if (shape === "poly") {
        const n = 5 + ((Math.random() * 3) | 0);
        p.poly = [];
        for (let k = 0; k < n; k++) {
          const ang = (k / n) * 6.283 + rand(-0.3, 0.3);
          const rad = rand(0.45, 1) * base * 0.7;
          p.poly.push(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
      }
      this.push(p);
    }
    this.ps.sort((a, b) => a.depth - b.depth);
    this.kick();
  }

  /** Soft gold dust drifting upward (cake wish, gift box). */
  rise(x: number, y: number, width: number, count: number) {
    for (let i = 0; i < count; i++) {
      const s = rand(1.4, 3.6);
      this.push({
        x: x + rand(-width / 2, width / 2), y: y + rand(-10, 10),
        vx: rand(-14, 14), vy: -rand(40, 130),
        w: s, h: s, rot: 0, vr: 0, flip: 0, vf: 0,
        shape: Math.random() < 0.25 ? "spark" : "dust",
        color: GOLD[(Math.random() * 3) | 0], depth: 1,
        gravity: -rand(4, 18), drag: 0.35, sway: rand(6, 22), swayF: rand(1, 2.5),
        age: -rand(0, 0.9), life: rand(2.4, 4.6), alpha: 1,
      });
    }
    this.kick();
  }

  /** Tiny sparkle burst in all directions. */
  sparkle(x: number, y: number, count = 14) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, 6.283);
      const sp = rand(60, 200);
      const s = rand(2, 4.4);
      this.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        w: s, h: s, rot: rand(0, 3), vr: rand(-3, 3), flip: 0, vf: 0,
        shape: Math.random() < 0.55 ? "spark" : "dust",
        color: GOLD[(Math.random() * 3) | 0], depth: 1,
        gravity: 40, drag: 2.2, sway: 0, swayF: 1,
        age: 0, life: rand(0.8, 1.5), alpha: 1,
      });
    }
    this.kick();
  }

  /** A soft travelling wave of gold particles, left→right in RTL reading direction (right→left). */
  wave(count = 90, duration = 1.8) {
    for (let i = 0; i < count; i++) {
      const t = rand(0, duration);
      const s = rand(1.4, 3.4);
      this.push({
        x: this.w + 20, y: rand(this.h * 0.12, this.h * 0.9),
        vx: -rand(this.w * 0.55, this.w * 0.95), vy: rand(-30, 30),
        w: s, h: s, rot: 0, vr: 0, flip: 0, vf: 0,
        shape: Math.random() < 0.2 ? "spark" : "dust",
        color: GOLD[(Math.random() * 3) | 0], depth: 1,
        gravity: rand(-10, 10), drag: 0.15, sway: rand(4, 14), swayF: rand(2, 4),
        age: -t, life: 2.8, alpha: 1,
      });
    }
    this.kick();
  }

  clear() {
    this.ps.length = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.halt();
  }

  private kick() {
    if (this.running || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private halt() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    const alive: P[] = [];
    for (const p of this.ps) {
      p.age += dt;
      if (p.age < 0) { alive.push(p); continue; }
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy = p.vy * k + p.gravity * dt;
      if (p.shape !== "dust" && p.shape !== "spark" && p.vy > 260 * p.depth) p.vy = 260 * p.depth; // terminal velocity → paper falls gently
      p.x += (p.vx + Math.sin(p.age * p.swayF + p.flip) * p.sway) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      const fadeStart = p.life * 0.7;
      p.alpha = p.age > fadeStart ? Math.max(0, 1 - (p.age - fadeStart) / (p.life - fadeStart)) : 1;
      if (p.age < p.life && p.y < this.h + 60 && p.x > -80 && p.x < this.w + 80 && p.alpha > 0) {
        alive.push(p);
        this.draw(p);
      }
    }
    this.ps = alive;
    ctx.globalAlpha = 1;
    if (alive.length) this.raf = requestAnimationFrame(this.frame);
    else {
      this.running = false;
      ctx.clearRect(0, 0, this.w, this.h);
    }
  };

  private draw(p: P) {
    const { ctx } = this;
    ctx.globalAlpha = p.alpha * (p.shape === "dust" || p.shape === "spark" ? 0.55 + 0.45 * Math.sin(p.age * 6 + p.flip) ** 2 : 0.55 + p.depth * 0.4 > 1 ? 1 : 0.55 + p.depth * 0.4);
    ctx.fillStyle = p.color;
    if (p.shape === "dust") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.w, 0, 6.283);
      ctx.fill();
      return;
    }
    if (p.shape === "spark") {
      const s = p.w * 2.4;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.cos(p.flip)); // paper turning in 3D
    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.w * 0.5, 0, 6.283);
      ctx.fill();
    } else if (p.shape === "poly" && p.poly) {
      ctx.beginPath();
      ctx.moveTo(p.poly[0], p.poly[1]);
      for (let i = 2; i < p.poly.length; i += 2) ctx.lineTo(p.poly[i], p.poly[i + 1]);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    if (p.color === "#FFFFFF" || p.color === "#F1E9DB") {
      ctx.strokeStyle = "rgba(86,62,50,.22)";
      ctx.lineWidth = 0.6;
      if (p.shape === "rect" || p.shape === "strip") ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  destroy() {
    this.halt();
    this.ro.disconnect();
    document.removeEventListener("visibilitychange", this.onVis);
    this.ps = [];
  }
}
