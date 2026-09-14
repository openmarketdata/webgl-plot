import { setupCanvasAndWebGL, clearCanvas } from "../src/webglplot";
import { WebglPolygonPlot, PolygonConfig } from "../src/WebglPolygonPlot";
import { WebglLinePlot, LineConfig } from "../src/WebglLinePlot";

const NUM_CANDLES = 40;
const TICK_MS = 100;
const REDRAW_MS = 1000;
const TICK_SIGMA = 0.12;

// Plot area in clip space; the margins on the right/bottom hold the axis labels.
const X_MIN = -0.95;
const X_MAX = 0.72;
const Y_MIN = -0.8;
const Y_MAX = 0.92;
const SLOT_WIDTH = (X_MAX - X_MIN) / NUM_CANDLES;
const BODY_HALF_WIDTH = SLOT_WIDTH * 0.35;
const MIN_BODY_HEIGHT = 0.004;
const X_LABEL_EVERY = 5; // minimum slots between time labels
const Y_TICKS = 6;
const TIME_STEPS_S = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

const GREEN: [number, number, number, number] = [0.15, 0.8, 0.35, 1];
const RED: [number, number, number, number] = [0.9, 0.25, 0.25, 1];

interface Candle {
  t: number; // open time (ms since epoch), aligned to the bar interval
  o: number;
  h: number;
  l: number;
  c: number;
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("my_canvas") as HTMLCanvasElement;
  const axesCanvas = document.getElementById("axes_canvas") as HTMLCanvasElement;
  if (!canvas || !axesCanvas) {
    console.error("Canvas elements not found!");
    return;
  }
  const maybeCtx = axesCanvas.getContext("2d");
  if (!maybeCtx) {
    console.error("2D context for axes overlay not available");
    return;
  }
  const axesCtx: CanvasRenderingContext2D = maybeCtx;
  const showXAxis = document.getElementById("showXAxis") as HTMLInputElement;
  const showYAxis = document.getElementById("showYAxis") as HTMLInputElement;
  const intervalGroup = document.getElementById("intervalGroup") as HTMLFieldSetElement;
  const intervalText = document.getElementById("intervalText") as HTMLSpanElement;

  const gl = setupCanvasAndWebGL(canvas, {
    backgroundColor: [0, 0, 0, 1],
    antialias: true,
  });

  const polygonPlot = new WebglPolygonPlot(gl);
  const linePlot = new WebglLinePlot(gl, NUM_CANDLES);

  // Fixed pool: slot i owns polygon i (body) and line i (wick).
  // Geometry is stored in local coords centred on x=0; the slot's x position
  // is applied through the per-polygon / per-line offset transform.
  const polygonConfigs: PolygonConfig[] = [];
  const lineConfigs: LineConfig[] = [];
  for (let i = 0; i < NUM_CANDLES; i++) {
    polygonConfigs.push({
      points: new Float32Array(8),
      fillColor: GREEN,
      strokeColor: [0, 0, 0, 1],
      strokeWeight: 0,
      isFilled: true,
      isStroked: false,
      offset: [0, 0],
      scale: [1, 1],
      enabled: false,
    });
    lineConfigs.push({
      points: new Float32Array(4),
      color: [0.85, 0.85, 0.85, 1],
      thickness: 1,
      offset: [0, 0],
      scale: [1, 1],
      enabled: false,
    });
  }
  polygonPlot.initPolygons(polygonConfigs);
  linePlot.initLines(lineConfigs);

  // candles[k] is the k-th candle ever opened; only the last NUM_CANDLES are visible.
  let candles: Candle[] = [];
  let candleMs = 5000;
  let priceCenter = 100;
  let priceHalfRange = 1;
  let axesDirty = true;

  const slotOf = (k: number) => k % NUM_CANDLES;

  // Newest candle sits in the rightmost slot; older ones step left.
  const slotX = (k: number) => X_MAX - SLOT_WIDTH * (candles.length - 1 - k + 0.5);

  const priceToY = (p: number) => {
    const t = (p - priceCenter) / (2 * priceHalfRange) + 0.5;
    return Y_MIN + t * (Y_MAX - Y_MIN);
  };

  const randomStep = () => (Math.random() - 0.5) * TICK_SIGMA;

  const bodyPoints = new Float32Array(8);
  const wickPoints = new Float32Array(4);

  function pushCandleGeometry(k: number) {
    const id = slotOf(k);
    const { o, h, l, c } = candles[k];
    let top = priceToY(Math.max(o, c));
    let bottom = priceToY(Math.min(o, c));
    if (top - bottom < MIN_BODY_HEIGHT) {
      const mid = (top + bottom) / 2;
      top = mid + MIN_BODY_HEIGHT / 2;
      bottom = mid - MIN_BODY_HEIGHT / 2;
    }
    bodyPoints.set([
      -BODY_HALF_WIDTH, bottom,
      BODY_HALF_WIDTH, bottom,
      BODY_HALF_WIDTH, top,
      -BODY_HALF_WIDTH, top,
    ]);
    polygonPlot.updatePolygonPoints(id, bodyPoints);
    polygonPlot.updatePolygonStyle(id, { fillColor: c >= o ? GREEN : RED });

    wickPoints.set([0, priceToY(l), 0, priceToY(h)]);
    linePlot.updateLinePoints(id, wickPoints);
  }

  function visibleRange(): [number, number] {
    const newest = candles.length - 1;
    return [Math.max(0, newest - NUM_CANDLES + 1), newest];
  }

  function layoutSlots() {
    const [oldest, newest] = visibleRange();
    for (let k = oldest; k <= newest; k++) {
      const id = slotOf(k);
      const x = slotX(k);
      polygonPlot.updatePolygonTransform(id, [1, 1], [x, 0]);
      linePlot.updateLineTransform(id, [1, 1], [x, 0]);
      polygonPlot.setPolygonEnabled(id, true);
      linePlot.setLineEnabled(id, true);
    }
    axesDirty = true;
  }

  function rescale() {
    const [oldest, newest] = visibleRange();
    let lo = Infinity;
    let hi = -Infinity;
    for (let k = oldest; k <= newest; k++) {
      lo = Math.min(lo, candles[k].l);
      hi = Math.max(hi, candles[k].h);
    }
    const pad = Math.max((hi - lo) * 0.1, 0.05);
    priceCenter = (hi + lo) / 2;
    priceHalfRange = (hi - lo) / 2 + pad;
    for (let k = oldest; k <= newest; k++) pushCandleGeometry(k);
    axesDirty = true;
  }

  function openCandle(t: number) {
    const last = candles.length ? candles[candles.length - 1].c : 100;
    candles.push({ t, o: last, h: last, l: last, c: last });
    layoutSlots();
    rescale();
  }

  // Simulate one sealed historical candle by random-walking through its ticks.
  function simulateCandle(t: number, open: number): Candle {
    const candle: Candle = { t, o: open, h: open, l: open, c: open };
    const ticks = Math.max(1, Math.round(candleMs / TICK_MS));
    for (let i = 0; i < ticks; i++) {
      candle.c += randomStep();
      candle.h = Math.max(candle.h, candle.c);
      candle.l = Math.min(candle.l, candle.c);
    }
    return candle;
  }

  // Fill every slot: NUM_CANDLES - 1 backfilled bars ending at the current
  // interval boundary, plus the in-progress bar.
  function resetCandles() {
    const startPrice = candles.length ? candles[candles.length - 1].c : 100;
    const currentBucket = Math.floor(Date.now() / candleMs) * candleMs;
    candles = [];
    let price = startPrice;
    for (let i = NUM_CANDLES - 1; i >= 1; i--) {
      const candle = simulateCandle(currentBucket - i * candleMs, price);
      candles.push(candle);
      price = candle.c;
    }
    openCandle(currentBucket);
  }

  function setBarInterval(ms: number) {
    candleMs = ms;
    intervalText.textContent = `${ms / 1000}s`;
    resetCandles();
  }

  // ---- Axes overlay (2D canvas on top of the WebGL canvas) ----

  const clipToPx = (x: number, w: number) => ((x + 1) / 2) * w;
  const clipToPy = (y: number, h: number) => ((1 - y) / 2) * h;

  function niceStep(rough: number): number {
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return nice * mag;
  }

  const timeFormat = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function drawAxes() {
    const dpr = window.devicePixelRatio || 1;
    const w = axesCanvas.clientWidth;
    const h = axesCanvas.clientHeight;
    if (axesCanvas.width !== Math.round(w * dpr) || axesCanvas.height !== Math.round(h * dpr)) {
      axesCanvas.width = Math.round(w * dpr);
      axesCanvas.height = Math.round(h * dpr);
    }
    const ctx = axesCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = "12px Arial, Helvetica, sans-serif";
    ctx.lineWidth = 1;

    const left = clipToPx(X_MIN, w);
    const right = clipToPx(X_MAX, w);
    const top = clipToPy(Y_MAX, h);
    const bottom = clipToPy(Y_MIN, h);

    if (showYAxis.checked) {
      const lo = priceCenter - priceHalfRange;
      const hi = priceCenter + priceHalfRange;
      const step = niceStep((hi - lo) / Y_TICKS);
      const decimals = Math.max(0, -Math.floor(Math.log10(step)));

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.fillStyle = "#ccc";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let p = Math.ceil(lo / step) * step; p <= hi; p += step) {
        const y = clipToPy(priceToY(p), h);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.fillText(p.toFixed(decimals), right + 8, y);
      }
      ctx.strokeStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.stroke();
    }

    if (showXAxis.checked) {
      const [oldest, newest] = visibleRange();
      const minLabelS = (candleMs * X_LABEL_EVERY) / 1000;
      const labelMs = 1000 * (TIME_STEPS_S.find((s) => s >= minLabelS) ?? minLabelS);
      ctx.strokeStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();

      ctx.fillStyle = "#ccc";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let k = oldest; k <= newest; k++) {
        if (candles[k].t % labelMs !== 0) continue;
        const x = clipToPx(slotX(k), w);
        ctx.beginPath();
        ctx.moveTo(x, bottom);
        ctx.lineTo(x, bottom + 5);
        ctx.stroke();
        ctx.fillText(timeFormat.format(candles[k].t), x, bottom + 8);
      }
    }
  }

  // ---- Controls ----

  showXAxis.addEventListener("change", () => (axesDirty = true));
  showYAxis.addEventListener("change", () => (axesDirty = true));
  intervalGroup.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === "interval") setBarInterval(Number(input.value));
  });
  window.addEventListener("resize", () => (axesDirty = true));

  const checked = intervalGroup.querySelector<HTMLInputElement>("input[name=interval]:checked");
  setBarInterval(checked ? Number(checked.value) : candleMs);

  // Simulated tick feed: random-walk the in-progress candle's close, and roll
  // over to a new candle whenever the wall clock crosses an interval boundary.
  setInterval(() => {
    const bucket = Math.floor(Date.now() / candleMs) * candleMs;
    if (bucket > candles[candles.length - 1].t) openCandle(bucket);
    const cur = candles[candles.length - 1];
    cur.c += randomStep();
    cur.h = Math.max(cur.h, cur.c);
    cur.l = Math.min(cur.l, cur.c);
  }, TICK_MS);

  // Incremental redraw: only the in-progress candle is re-pushed to the GPU,
  // unless its range escaped the current price window.
  setInterval(() => {
    const k = candles.length - 1;
    const cur = candles[k];
    if (cur.h > priceCenter + priceHalfRange || cur.l < priceCenter - priceHalfRange) {
      rescale();
    } else {
      pushCandleGeometry(k);
    }
  }, REDRAW_MS);

  function animate() {
    clearCanvas(gl);
    linePlot.draw();
    polygonPlot.draw();
    if (axesDirty) {
      axesDirty = false;
      drawAxes();
    }
    requestAnimationFrame(animate);
  }
  animate();
});
