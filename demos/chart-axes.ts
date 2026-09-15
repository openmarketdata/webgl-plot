/**
 * Draws time (x) and value (y) axes for a WebGL chart on a transparent 2D
 * canvas overlaid on the WebGL canvas. The plot area is given in clip space;
 * `xOf`/`yOf` map data values into clip space.
 */

export interface AxesOptions {
  plot: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** Data → clip-space mappers. */
  xOf: (timeMs: number) => number;
  yOf: (value: number) => number;
  /** Time labels: every `labelStepMs`, at multiples of it, within [fromMs, toMs]. */
  time: { fromMs: number; toMs: number; labelStepMs: number };
  /** Value labels: `ticks` nice steps across [lo, hi]. */
  value: { lo: number; hi: number; ticks: number };
  colors?: { axis?: string; grid?: string; text?: string };
}

const TIME_STEPS_S = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

/** Smallest "nice" time step (seconds) that is at least `minSeconds`. */
export function niceTimeStepS(minSeconds: number): number {
  return TIME_STEPS_S.find((s) => s >= minSeconds) ?? minSeconds;
}

/** Nice 1/2/5 step for a rough step size. */
export function niceStep(rough: number): number {
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

export function drawAxes(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, o: AxesOptions): void {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const px = (x: number) => ((x + 1) / 2) * w;
  const py = (y: number) => ((1 - y) / 2) * h;
  const axisColor = o.colors?.axis ?? "#888";
  const gridColor = o.colors?.grid ?? "rgba(255,255,255,0.12)";
  const textColor = o.colors?.text ?? "#ccc";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.font = "12px Arial, Helvetica, sans-serif";
  ctx.lineWidth = 1;

  const left = px(o.plot.xMin);
  const right = px(o.plot.xMax);
  const top = py(o.plot.yMax);
  const bottom = py(o.plot.yMin);

  // Value axis on the right.
  const { lo, hi, ticks } = o.value;
  const step = niceStep((hi - lo) / ticks);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    const y = py(o.yOf(v));
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.fillText(v.toFixed(decimals), right + 8, y);
  }
  ctx.strokeStyle = axisColor;
  ctx.beginPath();
  ctx.moveTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  // Time axis at the bottom.
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const { fromMs, toMs, labelStepMs } = o.time;
  for (let t = Math.ceil(fromMs / labelStepMs) * labelStepMs; t <= toMs; t += labelStepMs) {
    const x = px(o.xOf(t));
    if (x < left || x > right) continue;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, bottom + 5);
    ctx.stroke();
    ctx.fillText(timeFormat.format(t), x, bottom + 8);
  }
}
