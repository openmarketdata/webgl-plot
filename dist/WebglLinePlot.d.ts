import { LineConfig } from './LineConfig';
import { DataBounds } from './LogAxisUtils';
export type { LineConfig };
export declare class WebglLinePlot {
    private gl;
    private maxLines;
    private linesConfig;
    private numLines;
    private vertexBuffer;
    private colorBuffer;
    prog: WebGLProgram | null;
    private lineStarts;
    private lineLengths;
    private globalScale;
    private globalOffset;
    private locations;
    logX: boolean;
    logY: boolean;
    constructor(gl: WebGL2RenderingContext, maxLines: number);
    private _createShaderProgram;
    initLines(linesConfig: LineConfig[]): void;
    cleanup(): void;
    updateLinePoints(lineId: number, points: Float32Array): void;
    updateLineY(lineId: number, newY: Float32Array): void;
    updateLineColor(lineId: number, color: [number, number, number, number]): void;
    updateLineTransform(lineId: number, scale: [number, number], offset: [number, number]): void;
    /**
     * Update the thickness for a specific line.
     * @param lineId ID of the line to update
     * @param thickness New thickness value for the line
     */
    updateLineThickness(lineId: number, thickness: number): void;
    /**
     * Enable or disable rendering for a specific line.
     * @param lineId ID of the line to enable/disable
     * @param enabled True to enable rendering, false to disable
     */
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
    /**
     * Set the global transformation matrix for the plot.
     * @param scale Global scale factors [scaleX, scaleY]
     * @param offset Global offset values [offsetX, offsetY]
     */
    setGlobalTransform(scale: [number, number], offset: [number, number]): void;
    /**
     * Enable or disable logarithmic scaling for X and/or Y axes.
     *
     * When enabled, coordinates are transformed using log₁₀ on the GPU in real-time.
     * Negative and zero values are automatically filtered out (moved off-screen).
     *
     * **Important Notes:**
     * - Transformation happens on GPU for optimal performance
     * - No graph reinitialization required - changes apply immediately
     * - Auto-scaling will automatically account for log transformation
     *
     * **Example Usage:**
     * ```typescript
     * // Enable log Y-axis for exponential data
     * thinPlotter.setLogAxis(false, true);
     *
     * // Enable both axes for power-law data
     * thinPlotter.setLogAxis(true, true);
     *
     * // Disable all log scaling
     * thinPlotter.setLogAxis(false, false);
     * ```
     *
     * @param x Enable logarithmic base-10 scaling for X-axis
     * @param y Enable logarithmic base-10 scaling for Y-axis
     */
    setLogAxis(x: boolean, y: boolean): void;
    /**
     * Auto-scale the plotter to fit log-transformed data, using either actual data bounds
     * or converting existing transform-based viewport bounds to log space.
     *
     * This function intelligently handles the transition from linear to log space by
     * using actual data bounds when provided, or falling back to transforming the
     * current viewport bounds from linear to log space.
     *
     * **Use Cases:**
     * - After toggling log axes to maintain current view
     * - For smooth transitions between linear and log representations
     * - When you want to preserve user's current zoom/pan state
     * - For accurate scaling based on actual data bounds
     *
     * **Example Usage:**
     * ```typescript
     * // Preserve current coordinate space (recommended for maintaining zoom/pan)
     * const bounds = thinPlotter.getDataBounds();
     * thinPlotter.transformToLogSpace(bounds);
     *
     * // Alternative: same result, preserves current coordinate space
     * thinPlotter.transformToLogSpace();
     * ```
     *
     * @param dataBounds Optional actual data bounds {minX, maxX, minY, maxY}.
     *                   If provided, uses actual data bounds instead of transform-based bounds.
     * @returns True if smart scaling was applied, false if transformation not feasible
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
     *                   If not provided, will attempt to get bounds from current transform.
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
     * Get the data bounds of all enabled lines (for autoscaling purposes).
     * This returns the complete extent of all data and should be used with autoScale().
     * For preserving current coordinate space, use getDataBounds() instead.
     * @returns Object with minX, maxX, minY, maxY of all the data, or null if no valid data
     */
    getAllDataBounds(): DataBounds | null;
    /**
     * Get the data bounds of the current coordinate space (viewport).
     * This preserves the current zoom/pan when transforming to log space.
     * Use this with transformToLogSpace() to maintain user's coordinate space.
     * @returns Object with minX, maxX, minY, maxY of the current view with coordinate space information, or null if invalid transform
     */
    getDataBounds(): DataBounds | null;
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
    draw: () => void;
    /**
     * Gets the configuration for a specific line.
     * @param lineId The ID of the line.
     * @returns The LineConfig object or undefined if not found.
     */
    getLineConfig(lineId: number): LineConfig | undefined;
    /**
     * Get the current global transform scale values.
     * @returns [scaleX, scaleY] array
     */
    getGlobalScale(): [number, number];
    /**
     * Get the current global transform offset values.
     * @returns [offsetX, offsetY] array
     */
    getGlobalOffset(): [number, number];
}
//# sourceMappingURL=WebglLinePlot.d.ts.map