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
import { ColorRGBA } from "./ColorRGBA";
import { setupCanvasAndWebGL, clearCanvas } from "./WebGLHelpers";

export type PlotType = "line" | "scatter";

export interface PlotSeries {
  x: number[] | Float32Array;
  y: number[] | Float32Array;
  /** RGBA color, each channel in [0, 1]. */
  color?: [number, number, number, number];
  /** Line thickness in pixels (line plots only). */
  thickness?: number;
  label?: string;
}

export interface PlotConfig {
  /** Plot type. Defaults to "line". */
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

export interface PlotHandle {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  /** X range used for the plot (explicit or computed from data). */
  xRange: [number, number];
  /** Y range used for the plot (explicit or computed from data). */
  yRange: [number, number];
  /** Re-render the plot. */
  redraw: () => void;
  /** Release WebGL resources. */
  destroy: () => void;
}

const DEFAULT_COLORS: [number, number, number, number][] = [
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

/**
 * Render a static plot from a matplotlib-like JSON configuration.
 *
 * Supported types: "line" (default) and "scatter".
 */
export function plot(config: PlotConfig): PlotHandle {
  const type: PlotType = config.type ?? "line";
  if (type !== "line" && type !== "scatter") {
    throw new Error(`plot: unsupported type "${String(type)}"`);
  }

  const seriesList: PlotSeries[] = Array.isArray(config.data)
    ? config.data
    : [config.data];
  if (seriesList.length === 0) {
    throw new Error("plot: data must contain at least one series");
  }

  const xRange = computeRange(seriesList, "x", config["x-range"]);
  const yRange = computeRange(seriesList, "y", config["y-range"]);

  const canvas = resolveCanvas(config.canvas);
  const gl = setupCanvasAndWebGL(canvas, {
    antialias: true,
    backgroundColor: config.backgroundColor ?? [0, 0, 0, 1],
  });

  let drawFn: () => void;
  let cleanupFn: () => void;

  if (type === "line") {
    const plotter = new UnifiedLinePlot(gl, seriesList.length);
    plotter.initLines(
      seriesList.map((s, i) => ({
        points: toClipSpace(s, xRange, yRange),
        color: s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        thickness: s.thickness ?? 1,
        enabled: true,
      }))
    );
    drawFn = () => plotter.draw();
    cleanupFn = () => plotter.cleanup();
  } else {
    const totalPoints = seriesList.reduce((sum, s) => sum + s.x.length, 0);
    const plotter = new WebglScatterAcc(gl, totalPoints);
    plotter.setSquareSize((config.markerSize ?? 8) / canvas.width);
    plotter.setColor(new ColorRGBA(1, 1, 1, 1));
    for (let i = 0; i < seriesList.length; i++) {
      const s = seriesList[i];
      const points = toClipSpace(s, xRange, yRange);
      const rgba = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      const colors = new Uint8Array(s.x.length * 3);
      for (let j = 0; j < s.x.length; j++) {
        colors[j * 3] = Math.round(rgba[0] * 255);
        colors[j * 3 + 1] = Math.round(rgba[1] * 255);
        colors[j * 3 + 2] = Math.round(rgba[2] * 255);
      }
      plotter.addSquare(points, colors);
    }
    drawFn = () => plotter.draw();
    cleanupFn = () => {
      // WebglScatterAcc has no cleanup method; drop the reference.
    };
  }

  const redraw = () => {
    clearCanvas(gl);
    drawFn();
  };
  redraw();

  return {
    canvas,
    gl,
    xRange,
    yRange,
    redraw,
    destroy: cleanupFn,
  };
}
