/** Tiny damped spring for physical-feeling motion (keys, buttons, knobs). */
export class Spring {
  x: number;
  v = 0;
  private k: number;
  private c: number;

  /** k = stiffness, c = damping (defaults: ζ≈0.4 → small overshoot on release, like a real key). */
  constructor(x: number, k = 900, c = 24) {
    this.x = x;
    this.k = k;
    this.c = c;
  }

  step(target: number, dt: number, instant = false): number {
    if (instant) {
      this.x = target;
      this.v = 0;
      return this.x;
    }
    const a = this.k * (target - this.x) - this.c * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
