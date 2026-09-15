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
    /** Release WebGL resources. */
    destroy: () => void;
}
/**
 * Render a plot from a matplotlib-like JSON configuration.
 *
 * Supported types: "line" (default) and "scatter". The returned handle's
 * `update()` accepts partial config changes and re-renders.
 */
export declare function plot(config: PlotConfig): PlotHandle;
//# sourceMappingURL=plot.d.ts.map