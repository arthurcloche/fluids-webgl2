const requestAnimationFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame;

export class Clock {
  constructor() {
    this.running = false;
    this.interval = null;
    this.t0 = this.now();
    this.t = 0.0;
    this.maxdt = 0.25;
  }

  tick() {
    const t1 = this.now();
    const dt = (t1 - this.t0) / 1000;
    this.t0 = t1;
    this.t += dt;
    // don't tick on frame breaks or zero/negative ticks
    if (dt < this.maxdt && dt > 0) {
      this.ontick(dt);
    }
  }

  start(element) {
    this.running = true;
    if (requestAnimationFrame) {
      const f = () => {
        this.tick();
        if (this.running) {
          requestAnimationFrame(f, element);
        }
      };
      requestAnimationFrame(f, element);
    } else {
      this.interval = window.setInterval(() => {
        this.tick();
      }, 1);
    }
    this.t0 = this.now();
  }

  stop() {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
    this.running = false;
  }

  now() {
    return window.performance.now();
  }

  ontick(dt) {
    // override this
  }
}

export const fixedstep = (step, integrate, render) => {
  let accumulated = 0;
  let t = 0;
  return (dt) => {
    accumulated += dt;
    while (accumulated >= step) {
      integrate(step, t);
      accumulated -= step;
      dt -= step;
      t += step;
    }
    render(dt, t);
  };
};
