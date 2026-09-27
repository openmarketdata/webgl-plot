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
/**
 * Render a plot from a matplotlib-like JSON configuration.
 *
 * Supported types (per figure or per series): "line" (default), "scatter",
 * "segments", "bubble" and "bar". The returned handle's `update()` accepts
 * partial config changes and re-renders.
 */
export declare function plot(config: PlotConfig): PlotHandle;
//# sourceMappingURL=plot.d.ts.map