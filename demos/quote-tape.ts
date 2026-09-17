import { setupCanvasAndWebGL, clearCanvas } from "../src/webglplot";
import { WebglSegments } from "../src/WebglSegments";
import { WebglDots } from "../src/WebglDots";
import { drawAxes, niceTimeStepS } from "./chart-axes";

/**
 * Quote tape: every bid / ask / trade update in a rolling window of time
 * buckets. Bids and asks are thin horizontal lines spanning their bucket,
 * colored lighter at the start of the bucket and darker toward its end.
 * Trades are aggregated per bucket into a single dot at the volume-weighted
 * average price whose diameter grows with log(total size).
 */

type RGBA = [number, number, number, number];

interface QuoteEvent {
  t: number; // ms epoch
  kind: "bid" | "ask" | "trade";
  price: number;
  size: number; // trades only
}

const NUM_BUCKETS = 30;
const TICK_MS = 100;
const REDRAW_MS = 250;
const MAX_SEGMENTS = 65536;
const MAX_DOTS = NUM_BUCKETS + 1;

const X_MIN = -0.95;
const X_MAX = 0.72;
const Y_MIN = -0.8;
const Y_MAX = 0.92;
const SLOT_WIDTH = (X_MAX - X_MIN) / NUM_BUCKETS;
const Y_TICKS = 6;
const X_LABEL_EVERY = 5;

const BID_LIGHT: RGBA = [0.75, 0.93, 0.78, 1];
const BID_DARK: RGBA = [0.0, 0.42, 0.13, 1];
const ASK_LIGHT: RGBA = [0.98, 0.79, 0.79, 1];
const ASK_DARK: RGBA = [0.6, 0.05, 0.05, 1];
const TRADE_COLOR: RGBA = [0.1, 0.35, 0.85, 0.55];

interface TradeAgg {
  size: number;
  notional: number;
}

function mix(a: RGBA, b: RGBA, t: number): RGBA {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
}

function gaussian(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Simulated market: mid random walk with a fluctuating spread. */
class Market {
  mid = 100;
  spread = 0.04;

  step(t: number, out: QuoteEvent[]): void {
    this.mid += gaussian() * 0.012;
    this.spread = Math.max(0.01, Math.min(0.12, this.spread + gaussian() * 0.004));
    const bid = Math.round((this.mid - this.spread / 2) * 100) / 100;
    const ask = Math.round((this.mid + this.spread / 2) * 100) / 100;
    const r = Math.random();
    if (r < 0.4) out.push({ t, kind: "bid", price: bid - Math.floor(Math.random() * 3) * 0.01, size: 0 });
    else if (r < 0.8) out.push({ t, kind: "ask", price: ask + Math.floor(Math.random() * 3) * 0.01, size: 0 });
    if (Math.random() < 0.12) {
      const size = Math.max(1, Math.round(Math.exp(Math.random() * 9))); // 1 .. ~8100
      out.push({ t: t + 1, kind: "trade", price: Math.random() < 0.5 ? bid : ask, size });
    }
  }
}

function init() {
  const canvas = document.getElementById("my_canvas") as HTMLCanvasElement;
  const axesCanvas = document.getElementById("axes_canvas") as HTMLCanvasElement;
  const maybeCtx = axesCanvas.getContext("2d");
  if (!maybeCtx) throw new Error("2D context unavailable for axes overlay");
  const axesCtx: CanvasRenderingContext2D = maybeCtx;
  const intervalGroup = document.getElementById("intervalGroup") as HTMLFieldSetElement;
  const intervalText = document.getElementById("intervalText") as HTMLSpanElement;
  const stats = document.getElementById("stats") as HTMLSpanElement;

  const gl = setupCanvasAndWebGL(canvas, {
    backgroundColor: [0.98, 0.98, 0.98, 1],
    antialias: true,
  });
  const dpr = window.devicePixelRatio || 1;

  const quotes = new WebglSegments(gl, MAX_SEGMENTS);
  const trades = new WebglDots(gl, MAX_DOTS);

  const market = new Market();
  const events: QuoteEvent[] = [];
  const tradeAgg = new Map<number, TradeAgg>(); // bucket start -> aggregate
  let bucketMs = 5000;
  let currentBucket = 0; // start of the in-progress bucket (ms epoch)
  let priceLo = 99;
  let priceHi = 101;
  let axesDirty = true;

  // Data x is seconds since t0 (keeps float32 precise); y is price.
  const t0 = Math.floor(Date.now() / 1000) * 1000;
  const xs = (ms: number) => (ms - t0) / 1000;

  const windowStart = () => currentBucket - (NUM_BUCKETS - 1) * bucketMs;
  const bucketOf = (t: number) => Math.floor(t / bucketMs) * bucketMs;

  function clipX(ms: number): number {
    return X_MAX - ((currentBucket + bucketMs - ms) / bucketMs) * SLOT_WIDTH;
  }
  function clipY(price: number): number {
    return Y_MIN + ((price - priceLo) / (priceHi - priceLo)) * (Y_MAX - Y_MIN);
  }

  function ingest(e: QuoteEvent): void {
    const b = bucketOf(e.t);
    if (e.kind === "trade") {
      const agg = tradeAgg.get(b);
      if (agg) {
        agg.size += e.size;
        agg.notional += e.size * e.price;
      } else {
        tradeAgg.set(b, { size: e.size, notional: e.size * e.price });
      }
      return;
    }
    const phase = (e.t - b) / bucketMs;
    const color = e.kind === "bid" ? mix(BID_LIGHT, BID_DARK, phase) : mix(ASK_LIGHT, ASK_DARK, phase);
    quotes.addSegment(xs(b), e.price, xs(b + bucketMs), e.price, color);
  }

  /** One dot per bucket: x at bucket centre, y at VWAP, radius ~ log(total size). */
  function rebuildTradeDots(): void {
    trades.clear();
    for (const [b, agg] of tradeAgg) {
      const radius = (1 + 2 * Math.log10(agg.size)) * dpr;
      trades.addDot(xs(b + bucketMs / 2), agg.notional / agg.size, radius, TRADE_COLOR);
    }
  }

  function rebuildGpu(): void {
    quotes.clear();
    tradeAgg.clear();
    for (const e of events) ingest(e);
    rebuildTradeDots();
  }

  function prune(): void {
    const from = windowStart();
    let n = 0;
    while (n < events.length && events[n].t < from) n++;
    if (n) events.splice(0, n);
    for (const b of tradeAgg.keys()) if (b < from) tradeAgg.delete(b);
  }

  /** Simulate history for the whole visible window, then continue live. */
  function backfill(): void {
    events.length = 0;
    const now = Date.now();
    currentBucket = bucketOf(now);
    for (let t = windowStart(); t < now; t += TICK_MS) market.step(t, events);
    rebuildGpu();
    rescale();
    axesDirty = true;
  }

  function setBucket(ms: number): void {
    bucketMs = ms;
    intervalText.textContent = `${ms / 1000}s`;
    backfill();
  }

  function rescale(): void {
    let lo = Infinity;
    let hi = -Infinity;
    for (const e of events) {
      if (e.price < lo) lo = e.price;
      if (e.price > hi) hi = e.price;
    }
    if (!isFinite(lo)) return;
    const pad = Math.max(0.02, (hi - lo) * 0.08);
    priceLo = lo - pad;
    priceHi = hi + pad;
  }

  function updateTransforms(): void {
    const sx = SLOT_WIDTH / (bucketMs / 1000);
    const ox = X_MAX - xs(currentBucket + bucketMs) * sx;
    const sy = (Y_MAX - Y_MIN) / (priceHi - priceLo);
    const oy = Y_MIN - priceLo * sy;
    quotes.setGlobalTransform([sx, sy], [ox, oy]);
    trades.setGlobalTransform([sx, sy], [ox, oy]);
  }

  function redrawAxes(): void {
    const labelStepS = niceTimeStepS((bucketMs / 1000) * X_LABEL_EVERY);
    drawAxes(axesCanvas, axesCtx, {
      plot: { xMin: X_MIN, xMax: X_MAX, yMin: Y_MIN, yMax: Y_MAX },
      xOf: clipX,
      yOf: clipY,
      time: { fromMs: windowStart(), toMs: currentBucket + bucketMs, labelStepMs: labelStepS * 1000 },
      value: { lo: priceLo, hi: priceHi, ticks: Y_TICKS },
      colors: { axis: "#666", grid: "rgba(0,0,0,0.08)", text: "#333" },
    });
    axesDirty = false;
  }

  intervalGroup.addEventListener("change", (ev) => {
    const target = ev.target as HTMLInputElement;
    if (target.name === "interval") setBucket(Number(target.value));
  });
  window.addEventListener("resize", () => (axesDirty = true));

  setBucket(5000);

  // Live feed: new events are appended incrementally; a bucket rollover prunes
  // the window and rebuilds the (small) GPU buffers from the retained events.
  const pending: QuoteEvent[] = [];
  setInterval(() => {
    const now = Date.now();
    market.step(now, pending);
    const b = bucketOf(now);
    if (b > currentBucket) {
      currentBucket = b;
      prune();
      events.push(...pending);
      pending.length = 0;
      rebuildGpu();
      axesDirty = true;
    } else {
      for (const e of pending) {
        events.push(e);
        ingest(e);
      }
      pending.length = 0;
      rebuildTradeDots();
    }
  }, TICK_MS);

  let lastDraw = 0;
  function animate(ts: number): void {
    if (ts - lastDraw >= REDRAW_MS) {
      lastDraw = ts;
      const lo = priceLo;
      const hi = priceHi;
      rescale();
      if (lo !== priceLo || hi !== priceHi) axesDirty = true;
      updateTransforms();
      clearCanvas(gl);
      quotes.draw();
      trades.draw();
      if (axesDirty) redrawAxes();
      let totalSize = 0;
      for (const agg of tradeAgg.values()) totalSize += agg.size;
      stats.textContent = `${quotes.numSegments} quotes, ${totalSize.toLocaleString()} traded in window`;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

init();
