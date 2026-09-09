import { setupCanvasAndWebGL, clearCanvas } from "../src/webglplot";
import { WebglPolygonPlot, PolygonConfig } from "../src/WebglPolygonPlot";
import { WebglLinePlot, LineConfig } from "../src/WebglLinePlot";

const NUM_CANDLES = 40;
const TICK_MS = 100;
const REDRAW_MS = 1000;
const CANDLE_MS = 5000;

const X_MIN = -0.95;
const X_MAX = 0.95;
const Y_MIN = -0.85;
const Y_MAX = 0.85;
const SLOT_WIDTH = (X_MAX - X_MIN) / NUM_CANDLES;
const BODY_HALF_WIDTH = SLOT_WIDTH * 0.35;
const MIN_BODY_HEIGHT = 0.004;

const GREEN: [number, number, number, number] = [0.15, 0.8, 0.35, 1];
const RED: [number, number, number, number] = [0.9, 0.25, 0.25, 1];

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("my_canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element 'my_canvas' not found!");
    return;
  }

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
  const candles: Candle[] = [];
  let priceCenter = 100;
  let priceHalfRange = 1;

  const slotOf = (k: number) => k % NUM_CANDLES;

  const priceToY = (p: number) => {
    const t = (p - priceCenter) / (2 * priceHalfRange) + 0.5;
    return Y_MIN + t * (Y_MAX - Y_MIN);
  };

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

  function layoutSlots() {
    const newest = candles.length - 1;
    const oldest = Math.max(0, newest - NUM_CANDLES + 1);
    for (let k = oldest; k <= newest; k++) {
      const id = slotOf(k);
      // Newest candle sits in the rightmost slot; older ones step left.
      const x = X_MAX - SLOT_WIDTH * (newest - k + 0.5);
      polygonPlot.updatePolygonTransform(id, [1, 1], [x, 0]);
      linePlot.updateLineTransform(id, [1, 1], [x, 0]);
      polygonPlot.setPolygonEnabled(id, true);
      linePlot.setLineEnabled(id, true);
    }
  }

  function rescale() {
    const newest = candles.length - 1;
    const oldest = Math.max(0, newest - NUM_CANDLES + 1);
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
  }

  function openCandle() {
    const last = candles.length ? candles[candles.length - 1].c : 100;
    candles.push({ o: last, h: last, l: last, c: last });
    layoutSlots();
    rescale();
  }

  openCandle();

  // Simulated tick feed: random-walk the in-progress candle's close.
  setInterval(() => {
    const cur = candles[candles.length - 1];
    cur.c += (Math.random() - 0.5) * 0.12;
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

  // Seal the current candle and open a new one; scroll everything left.
  setInterval(openCandle, CANDLE_MS);

  function animate() {
    clearCanvas(gl);
    linePlot.draw();
    polygonPlot.draw();
    requestAnimationFrame(animate);
  }
  animate();
});
