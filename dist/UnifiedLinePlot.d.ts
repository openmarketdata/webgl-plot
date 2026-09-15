import { DataBounds } from './WebglLineThick';
import { LineConfig } from './LineConfig';
export declare class UnifiedLinePlot {
    private gl;
    private maxLines;
    private internalPlotter;
    constructor(gl: WebGL2RenderingContext, maxLines: number);
    /**
     * Initializes or re-initializes lines. Determines the internal plotter type
     * based on the thickness of the first line in the configuration array.
     * @param linesConfig Array of LineConfig objects.
     */
    initLines(linesConfig: LineConfig[]): void;
    draw(): void;
    cleanup(): void;
    updateLinePoints(lineId: number, points: Float32Array): void;
    updateLineY(lineId: number, newY: Float32Array): void;
    updateLineColor(lineId: number, color: [number, number, number, number]): void;
    updateLineTransform(lineId: number, scale: [number, number], offset: [number, number]): void;
    updateLineThickness(lineId: number, thickness: number): void;
    setLineEnabled(lineId: number, enabled: boolean): void;
    /**
     * Enable or disable rendering for multiple lines at once.
     * @param lineIds Array of line IDs to enable/disable
     * @param enabled True to enable rendering, false to disable
     */
    setMultipleLinesEnabled(lineIds: number[], enabled: boolean): void;
    /**
     * Update transform parameters for multiple lines at once.
     * @param lineIds Array of line IDs to update
     * @param scale Scale factors [scaleX, scaleY]
     * @param offset Offset values [offsetX, offsetY]
     */
    updateMultipleLinesTransform(lineIds: number[], scale: [number, number], offset: [number, number]): void;
    setGlobalTransform(scale: [number, number], offset: [number, number]): void;
    /**
     * Auto-scale to fit all enabled lines in the current coordinate space.
     *
     * **IMPORTANT**: This method operates within the current coordinate space (linear or log)
     * and does NOT change coordinate spaces. It calculates bounds appropriate for the current
     * axis configuration and applies the transform.
     *
     * **Use autoScale() when:**
     * - Want to fit all data in the current coordinate space
     * - Need simple auto-scaling without changing coordinate spaces
     * - Don't need to preserve current zoom/pan state
     *
     * **⚠️ WARNING: Do NOT combine autoScale() with coordinate transforms!**
     * - autoScale() already works in the current coordinate space
     * - Calling transformToLogSpace() after autoScale() causes double-conversion
     *
     * **For coordinate space changes, use:**
     * - `transformToLogSpace()` - Switch to or operate in log space
     * - `transformToLinearSpace()` - Switch to or operate in linear space
     *
     * @returns DataBounds object with calculated bounds in current coordinate space, or null if no valid data
     *
     * @example
     * ```typescript
     * // ✅ CORRECT: Simple auto-scaling in current coordinate space
     * plotter.setLogAxis(false, true); // Enable log Y
     * plotter.autoScale(); // Auto-scales in log Y space - NO conversion needed!
     *
     * // ❌ WRONG: Don't combine autoScale() with coordinate transforms
     * // const bounds = plotter.autoScale();
     * // plotter.transformToLogSpace(bounds); // This causes double-conversion!
     *
     * // ✅ CORRECT: For coordinate space conversion, use getAllDataBounds():
     * // plotter.setLogAxis(false, true); // Enable log Y
     * // const bounds = plotter.getAllDataBounds(); // Gets linear data bounds
     * // if (bounds) plotter.transformToLogSpace(bounds); // Converts to log space
     * ```
     */
    autoScale(): DataBounds | null;
    getLineConfig(lineId: number): Partial<LineConfig> | LineConfig | undefined;
    /**
     * Get the data bounds of the current coordinate space (viewport) with coordinate space information.
     * This preserves the current zoom/pan when transforming to log space.
     *
     * **ENHANCED**: This method now includes coordinate space information for each axis,
     * eliminating ambiguity about whether bounds are in linear or log space.
     *
     * **Use getDataBounds() when:**
     * - You want to preserve current zoom/pan state
     * - You need to know the coordinate space of the returned bounds
     * - Followed by transformToLogSpace() which automatically handles coordinate conversion
     *
     * @returns Object with minX, maxX, minY, maxY of the current view and coordinateSpace info, or null if no valid data
     *
     * @example
     * ```typescript
     * // Enhanced API automatically handles coordinate spaces
     * const bounds = plotter.getDataBounds(); // Returns bounds with coordinate space info
     * if (bounds) {
     *   console.log(`X axis in ${bounds.coordinateSpace.x} space, Y axis in ${bounds.coordinateSpace.y} space`);
     *   plotter.transformToLogSpace(bounds); // Automatically converts coordinate spaces as needed
     * }
     *
     * // Works seamlessly in any coordinate mode - no manual conversion needed!
     * ```
     */
    getDataBounds(): DataBounds | null;
    /**
     * Get the data bounds of all enabled lines (for autoscaling purposes) with coordinate space information.
     * This returns the complete extent of all data and should be used with autoScale().
     * For preserving current coordinate space, use getDataBounds() instead.
     *
     * @returns Object with minX, maxX, minY, maxY of all the data and coordinateSpace info, or null if no valid data
     */
    getAllDataBounds(): DataBounds | null;
    /**
     * Enable or disable logarithmic scaling for X and/or Y axes.
     *
     * **After calling setLogAxis(), you need to apply appropriate scaling:**
     *
     * **For view preservation (recommended):**
     * 1. Get current bounds: `const bounds = plotter.getDataBounds()`
     * 2. Convert to linear space if needed: `transformBoundsToLinearSpace(bounds, oldLogX, oldLogY)`
     * 3. Apply new coordinate space: `transformToLogSpace(linearBounds)` or linear transform
     *
     * **For simple auto-scaling:**
     * - **Enabling log axes**: Use `getAllDataBounds()` → `transformToLogSpace()`
     * - **Disabling log axes**: Use `autoScale()` (resets to linear)
     *
     * @param x Enable logarithmic base-10 scaling for X-axis
     * @param y Enable logarithmic base-10 scaling for Y-axis
     *
     * @example
     * ```typescript
     * // View preservation when toggling axes
     * const currentBounds = plotter.getDataBounds(); // Current coordinate space
     * const linearBounds = transformBoundsToLinearSpace(currentBounds, wasLogX, wasLogY);
     * plotter.setLogAxis(true, false); // Toggle to log X
     * plotter.transformToLogSpace(linearBounds); // Preserve view
     *
     * // Simple auto-scaling approach
     * plotter.setLogAxis(false, true); // Enable log Y
     * const bounds = plotter.getAllDataBounds();
     * if (bounds) plotter.transformToLogSpace(bounds);
     * ```
     */
    setLogAxis(x: boolean, y: boolean): void;
    /**
     * Transform data bounds to logarithmic space and apply appropriate scaling.
     *
     * **ENHANCED**: This method now automatically handles coordinate space conversion.
     * It detects the coordinate space of input bounds and converts as needed.
     *
     * **Typical usage patterns:**
     * - **Any coordinate mode**: getDataBounds() → transformToLogSpace() (always works!)
     * - **Initial setup**: getAllDataBounds() → transformToLogSpace()
     * - **Zoom/pan operations**: getDataBounds() → transformToLogSpace()
     *
     * @param dataBounds Optional data bounds with coordinate space information.
     *                   If not provided, will attempt to get bounds from internal plotter.
     * @returns True if log space transformation was applied successfully,
     *          false if transformation not feasible (e.g., no positive data for log axes)
     *
     * @example
     * ```typescript
     * // Works seamlessly in any coordinate mode
     * plotter.setLogAxis(false, true); // Enable log Y
     * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
     * const success = plotter.transformToLogSpace(bounds); // Automatically handles conversion
     * if (!success) console.log("Failed to transform - check for positive data");
     *
     * // Even works when switching between coordinate spaces
     * // (bounds might be in log space, but transformToLogSpace handles this automatically)
     * const currentBounds = plotter.getDataBounds();
     * plotter.transformToLogSpace(currentBounds); // Always works correctly!
     * ```
     */
    transformToLogSpace(dataBounds?: DataBounds | null): boolean;
    /**
     * Transform data bounds to linear space and apply appropriate scaling.
     *
     * **ENHANCED**: This method automatically handles coordinate space conversion.
     * It detects the coordinate space of input bounds and converts as needed.
     *
     * **Typical usage patterns:**
     * - **Switching to linear axes**: `getDataBounds()` → `transformToLinearSpace()` (preserves view)
     * - **Zoom/pan in linear space**: `getDataBounds()` → `transformToLinearSpace()`
     * - **Initial linear setup**: `getAllDataBounds()` → `transformToLinearSpace()`
     *
     * @param dataBounds Optional data bounds with coordinate space information.
     *                   If not provided, will attempt to get bounds from internal plotter.
     * @returns True if linear space transformation was applied successfully,
     *          false if transformation not feasible
     *
     * @example
     * ```typescript
     * // Switching from log to linear axes while preserving view
     * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
     * plotter.setLogAxis(false, false); // Switch to linear axes
     * const success = plotter.transformToLinearSpace(bounds); // Preserves current view
     *
     * // Works seamlessly from any coordinate mode
     * const currentBounds = plotter.getDataBounds();
     * plotter.transformToLinearSpace(currentBounds); // Always handles conversion correctly!
     * ```
     */
    transformToLinearSpace(dataBounds?: DataBounds | null): boolean;
    /**
     * Gets the type of the currently active internal plotter.
     * @returns A string indicating the type of the internal plotter:
     * 'WebglLinePlot', 'WebglLineThick', or 'null'.
     */
    getInternalPlotterType(): "WebglLinePlot" | "WebglLineThick" | "null";
    /**
     * Get the current global transform scale values.
     * @returns [scaleX, scaleY] array or [1, 1] if no plotter is initialized
     */
    getGlobalScale(): [number, number];
    /**
     * Get the current global transform offset values.
     * @returns [offsetX, offsetY] array or [0, 0] if no plotter is initialized
     */
    getGlobalOffset(): [number, number];
}
//# sourceMappingURL=UnifiedLinePlot.d.ts.map