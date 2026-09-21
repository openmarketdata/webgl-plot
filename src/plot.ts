/**
 * Matplotlib-style declarative plotting API.
 *
 * Example:
 * ```typescript
 * plot({
 *   type: "line",
 *   "x-range": [-10, 10],
 *   data: { x: [1, 2, 3], y: [2, 4, 6] },
 * });
 * ```
 */

import { UnifiedLinePlot } from "./UnifiedLinePlot";
import { WebglScatterAcc } from "./WebglScatterAcc";
import { WebglSegments } from "./WebglSegments";
import { WebglDots } from "./WebglDots";
import { WebglPolygonPlot } from "./WebglPolygonPlot";
import { ColorRGBA } from "./ColorRGBA";
import { setupCanvasAndWebGL, clearCanvas, handleCanvasResize } from "./WebGLHelpers";

/**
 * - "line": polyline through the points.
 * - "scatter": square markers of a single size (`markerSize`).
 * - "segments": independent line segments; points are consumed in pairs
 *   ((x[0],y[0])->(x[1],y[1]), (x[2],y[2])->(x[3],y[3]), ...).
 * - "bubble": round markers with per-point radius (`sizes`) and color (`colors`).
 * - "bar": vertical bars from `baseline` to y, `width` wide (data units).
 */
export type PlotType = "line" | "scatter" | "segments" | "bubble" | "bar";

export type RGBA = [number, number, number, number];

export interface PlotSeries {
  /** Per-series type; defaults to the figure's `type`. */
  type?: PlotType;
  x: number[] | Float32Array;
  y: number[] | Float32Array;
  /** RGBA color, each channel in [0, 1]. */
  color?: RGBA;
  /** Line thickness in pixels (line plots only). */
  thickness?: number;
  label?: string;
  /** Per-point radius in pixels (bubble only). Falls back to markerSize / 2. */
  sizes?: number[];
  /** Per-point colors (bubble and bar). Falls back to `color`. */
  colors?: RGBA[];
  /** Bar width in x data units (bar only). Defaults to 80% of the smallest x spacing. */
  width?: number;
  /** Bars extend from this y value (bar only). Defaults to 0. */
  baseline?: number;
}

export interface PlotConfig {
  /** Default plot type for series that do not set their own. Defaults to "line". */
  type?: PlotType;
  /** X axis range as [min, max]. Defaults to the data extent. */
  "x-range"?: [number, number];
  /** Y axis range as [min, max]. Defaults to the data extent. */
  "y-range"?: [number, number];
  /** A single series or an array of series. */
  data: PlotSeries | PlotSeries[];
  /** Target canvas (element or element id). Created and appended to <body> if omitted. */
  canvas?: HTMLCanvasElement | string;
  /** Background color RGBA, each channel in [0, 1]. Defaults to black. */
  backgroundColor?: [number, number, number, number];
  /** Marker size in pixels (scatter plots only). Defaults to 8. */
  markerSize?: number;
}

/** Partial configuration accepted by {@link PlotHandle.update}. */
export type PlotUpdate = Partial<Omit<PlotConfig, "canvas">>;

export interface PlotHandle {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  /** X range used for the plot (explicit or computed from data). */
  xRange: [number, number];
  /** Y range used for the plot (explicit or computed from data). */
  yRange: [number, number];
  /**
   * Apply a partial configuration and re-render, e.g.
   * `figure.update({ "x-range": [-20, 20] })` or
   * `figure.update({ data: { x: [...], y: [...] } })`.
   * Omitted keys keep their current values; pass `undefined` explicitly
   * (e.g. `{ "x-range": undefined }`) to revert a range to the data extent.
   */
  update: (changes: PlotUpdate) => void;
  /** Re-render the plot. */
  redraw: () => void;
  /** Fit the drawing buffer to the canvas's CSS size (times devicePixelRatio) and re-render. */
  resize: () => void;
  /** Release WebGL resources. */
  destroy: () => void;
}

const PLOT_TYPES: readonly PlotType[] = ["line", "scatter", "segments", "bubble", "bar"];

const DEFAULT_COLORS: RGBA[] = [
  [0.12, 0.47, 0.71, 1],
  [1.0, 0.5, 0.05, 1],
  [0.17, 0.63, 0.17, 1],
  [0.84, 0.15, 0.16, 1],
  [0.58, 0.4, 0.74, 1],
  [0.55, 0.34, 0.29, 1],
];

function resolveCanvas(canvas?: HTMLCanvasElement | string): HTMLCanvasElement {
  if (canvas instanceof HTMLCanvasElement) {
    return canvas;
  }
  if (typeof canvas === "string") {
    const el = document.getElementById(canvas);
    if (!(el instanceof HTMLCanvasElement)) {
      throw new Error(`plot: no <canvas> element found with id "${canvas}"`);
    }
    return el;
  }
  const created = document.createElement("canvas");
  created.width = 800;
  created.height = 600;
  document.body.appendChild(created);
  return created;
}

function computeRange(
  series: PlotSeries[],
  axis: "x" | "y",
  explicit?: [number, number]
): [number, number] {
  if (explicit) {
    if (explicit[0] === explicit[1]) {
      throw new Error(`plot: ${axis}-range must span a non-zero interval`);
    }
    return explicit;
  }
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    const values = s[axis];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (axis === "y" && s.type === "bar" && values.length > 0) {
      const base = s.baseline ?? 0;
      if (base < min) min = base;
      if (base > max) max = base;
    }
  }
  if (!isFinite(min) || !isFinite(max)) {
    throw new Error(`plot: cannot compute ${axis}-range from empty data`);
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }
  return [min, max];
}

function toClipSpace(
  s: PlotSeries,
  xRange: [number, number],
  yRange: [number, number]
): Float32Array {
  if (s.x.length !== s.y.length) {
    throw new Error("plot: series x and y must have the same length");
  }
  const xSpan = xRange[1] - xRange[0];
  const ySpan = yRange[1] - yRange[0];
  const points = new Float32Array(s.x.length * 2);
  for (let i = 0; i < s.x.length; i++) {
    points[i * 2] = ((s.x[i] - xRange[0]) / xSpan) * 2 - 1;
    points[i * 2 + 1] = ((s.y[i] - yRange[0]) / ySpan) * 2 - 1;
  }
  return points;
}

interface Artist {
  draw: () => void;
  cleanup: () => void;
}

interface Scene {
  xRange: [number, number];
  yRange: [number, number];
  draw: () => void;
  cleanup: () => void;
}

interface Ranges {
  x: [number, number];
  y: [number, number];
}

function lineArtist(gl: WebGL2RenderingContext, s: PlotSeries, color: RGBA, r: Ranges): Artist {
  const plotter = new UnifiedLinePlot(gl, 1);
  plotter.initLines([
    { points: toClipSpace(s, r.x, r.y), color, thickness: s.thickness ?? 1, enabled: true },
  ]);
  return { draw: () => plotter.draw(), cleanup: () => plotter.cleanup() };
}

function scatterArtist(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  s: PlotSeries,
  color: RGBA,
  r: Ranges,
  markerSize: number
): Artist {
  const plotter = new WebglScatterAcc(gl, Math.max(1, s.x.length));
  plotter.setSquareSize(markerSize / canvas.width);
  plotter.setColor(new ColorRGBA(1, 1, 1, 1));
  const colors = new Uint8Array(s.x.length * 3);
  for (let j = 0; j < s.x.length; j++) {
    colors[j * 3] = Math.round(color[0] * 255);
    colors[j * 3 + 1] = Math.round(color[1] * 255);
    colors[j * 3 + 2] = Math.round(color[2] * 255);
  }
  plotter.addSquare(toClipSpace(s, r.x, r.y), colors);
  return {
    draw: () => plotter.draw(),
    cleanup: () => {
      // WebglScatterAcc has no cleanup method; drop the reference.
    },
  };
}

function segmentsArtist(gl: WebGL2RenderingContext, s: PlotSeries, color: RGBA, r: Ranges): Artist {
  if (s.x.length % 2 !== 0) {
    throw new Error("plot: segments series needs an even number of points (pairs of endpoints)");
  }
  const pts = toClipSpace(s, r.x, r.y);
  const n = s.x.length / 2;
  const plotter = new WebglSegments(gl, Math.max(1, n));
  for (let i = 0; i < n; i++) {
    const c = s.colors?.[i] ?? color;
    plotter.addSegment(pts[i * 4], pts[i * 4 + 1], pts[i * 4 + 2], pts[i * 4 + 3], c);
  }
  return { draw: () => plotter.draw(), cleanup: () => plotter.cleanup() };
}

function bubbleArtist(
  gl: WebGL2RenderingContext,
  s: PlotSeries,
  color: RGBA,
  r: Ranges,
  markerSize: number
): Artist {
  const pts = toClipSpace(s, r.x, r.y);
  const plotter = new WebglDots(gl, Math.max(1, s.x.length));
  const dpr = window.devicePixelRatio || 1;
  for (let i = 0; i < s.x.length; i++) {
    const radius = (s.sizes?.[i] ?? markerSize / 2) * dpr;
    plotter.addDot(pts[i * 2], pts[i * 2 + 1], radius, s.colors?.[i] ?? color);
  }
  return { draw: () => plotter.draw(), cleanup: () => plotter.cleanup() };
}

function defaultBarWidth(x: number[] | Float32Array): number {
  if (x.length < 2) return 1;
  const sorted = Array.from(x).sort((a, b) => a - b);
  let gap = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i] - sorted[i - 1];
    if (d > 0 && d < gap) gap = d;
  }
  return isFinite(gap) ? gap * 0.8 : 1;
}

function barArtist(gl: WebGL2RenderingContext, s: PlotSeries, color: RGBA, r: Ranges): Artist {
  if (s.x.length !== s.y.length) {
    throw new Error("plot: series x and y must have the same length");
  }
  const half = (s.width ?? defaultBarWidth(s.x)) / 2;
  const base = s.baseline ?? 0;
  const xSpan = r.x[1] - r.x[0];
  const ySpan = r.y[1] - r.y[0];
  const cx = (v: number) => ((v - r.x[0]) / xSpan) * 2 - 1;
  const cy = (v: number) => ((v - r.y[0]) / ySpan) * 2 - 1;
  const plotter = new WebglPolygonPlot(gl);
  plotter.initPolygons(
    Array.from(s.x, (x, i) => {
      const x0 = cx(x - half);
      const x1 = cx(x + half);
      const y0 = cy(base);
      const y1 = cy(s.y[i]);
      return {
        points: new Float32Array([x0, y0, x1, y0, x1, y1, x0, y1]),
        fillColor: s.colors?.[i] ?? color,
        strokeColor: [0, 0, 0, 0] as RGBA,
        strokeWeight: 0,
        isFilled: true,
        isStroked: false,
        enabled: true,
      };
    })
  );
  return { draw: () => plotter.draw(), cleanup: () => plotter.cleanup() };
}

function buildScene(
  config: PlotConfig,
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext
): Scene {
  const defaultType: PlotType = config.type ?? "line";

  const seriesList: PlotSeries[] = Array.isArray(config.data)
    ? config.data
    : [config.data];
  if (seriesList.length === 0) {
    throw new Error("plot: data must contain at least one series");
  }
  const typed = seriesList.map((s) => ({ ...s, type: s.type ?? defaultType }));
  for (const s of typed) {
    if (!PLOT_TYPES.includes(s.type)) {
      throw new Error(`plot: unsupported type "${String(s.type)}"`);
    }
    if (s.x.length !== s.y.length) {
      throw new Error("plot: series x and y must have the same length");
    }
  }

  const ranges: Ranges = {
    x: computeRange(typed, "x", config["x-range"]),
    y: computeRange(typed, "y", config["y-range"]),
  };
  const markerSize = config.markerSize ?? 8;

  const artists: Artist[] = typed.map((s, i) => {
    const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    if (s.x.length === 0) {
      return { draw: () => undefined, cleanup: () => undefined };
    }
    switch (s.type) {
      case "scatter":
        return scatterArtist(gl, canvas, s, color, ranges, markerSize);
      case "segments":
        return segmentsArtist(gl, s, color, ranges);
      case "bubble":
        return bubbleArtist(gl, s, color, ranges, markerSize);
      case "bar":
        return barArtist(gl, s, color, ranges);
      default:
        return lineArtist(gl, s, color, ranges);
    }
  });

  return {
    xRange: ranges.x,
    yRange: ranges.y,
    draw: () => artists.forEach((a) => a.draw()),
    cleanup: () => artists.forEach((a) => a.cleanup()),
  };
}

/**
 * Render a plot from a matplotlib-like JSON configuration.
 *
 * Supported types (per figure or per series): "line" (default), "scatter",
 * "segments", "bubble" and "bar". The returned handle's `update()` accepts
 * partial config changes and re-renders.
 */
export function plot(config: PlotConfig): PlotHandle {
  const canvas = resolveCanvas(config.canvas);
  const gl = setupCanvasAndWebGL(canvas, {
    antialias: true,
    backgroundColor: config.backgroundColor ?? [0, 0, 0, 1],
  });

  let current: PlotConfig = { ...config };
  let scene = buildScene(current, canvas, gl);

  const redraw = () => {
    clearCanvas(gl);
    scene.draw();
  };
  redraw();

  const rebuild = (next: PlotConfig) => {
    const nextScene = buildScene(next, canvas, gl);
    scene.cleanup();
    current = next;
    scene = nextScene;
    handle.xRange = scene.xRange;
    handle.yRange = scene.yRange;
    redraw();
  };

  const handle: PlotHandle = {
    canvas,
    gl,
    xRange: scene.xRange,
    yRange: scene.yRange,
    update: (changes: PlotUpdate) => rebuild({ ...current, ...changes, canvas }),
    redraw,
    resize: () => {
      handleCanvasResize(canvas, gl);
      rebuild(current);
    },
    destroy: () => scene.cleanup(),
  };
  return handle;
}
