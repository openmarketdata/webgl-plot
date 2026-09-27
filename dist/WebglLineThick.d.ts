import { LineConfig } from './LineConfig';
import { DataBounds } from './LogAxisUtils';
export type { DataBounds } from './LogAxisUtils';
export declare class WebglLineThick {
    private gl;
    prog: WebGLProgram | null;
    private maxLines;
    private pointsTexture;
    private vao;
    private vertexBuffer;
    private locations;
    private lineDataUBO;
    private lineDataUBObindingPoint;
    private lineDataStride;
    private lineDataArrayBuffer;
    private lineDataView;
    private reusableFloat32Array4;
    private reusableInt32Array1;
    private globalTransformDirty;
    private totalVertexCount;
    private numLines;
    private totalValidPoints;
    private pointsData;
    private texWidth;
    private texHeight;
    private lineOriginalNumPointsCache;
    private lineStartIndexCache;
    private lineEnabledStatus;
    private sharpTurnCache;
    private pointsHashCache;
    private globalScale;
    private globalOffset;
    logX: boolean;
    logY: boolean;
    /**
     * Creates an instance of WebglLineThick.
     * @param gl WebGL2 rendering context.
     * @param maxLines Maximum number of lines this instance can handle.
     */
    constructor(gl: WebGL2RenderingContext, maxLines: number);
    /**
     * Initializes or updates line data, including points texture, VBO, UBO,
     * and potentially GPU reduction resources.
     * @param lines An array of line objects to draw.
     */
    initLines(lines: LineConfig[]): void;
    /**
     * Sets the global scale and offset applied AFTER per-line transforms.
     * @param scale Tuple `[scaleX, scaleY]`.
     * @param offset Tuple `[offsetX, offsetY]`.
     */
    setGlobalTransform(scale: [number, number], offset: [number, number]): void;
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
     * Computes the min/max bounds of enabled lines using CPU iteration.
     * Internal method.
     * @returns DataBounds object or null if no enabled lines with points found.
     */
    private _computeBoundsCPU;
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
    /**
     * Computes sharp turn detection for a line with caching and optimizations.
     * @param lineId Line identifier
     * @param pointsArray Points array for the line
     * @param numPts Number of points in the line
     * @returns Boolean array indicating sharp turns for each point
     */
    private computeSharpTurns;
    /**
     * Helper to setup vertex attributes with error handling.
     * @param attributes Array of attribute configurations
     * @param stride Vertex stride in bytes
     */
    private setupVertexAttributes;
    /**
     * Generic helper to update UBO data and sync with GPU buffer.
     * @param byteOffsets Array of byte offsets to update
     * @param dataViews Array of typed array views containing the data
     */
    private updateUBOData;
    /**
     * Updates the per-line transform (scale and offset) for multiple lines using UBO updates.
     */
    updateLinesTransform(lineIds: number[], scale: [number, number], offset: [number, number]): void;
    /**
     * Updates the per-line transform for a specific line.
     */
    updateLineTransform(lineId: number, scale: [number, number], offset: [number, number]): void;
    /**
     * Updates the color for a specific line.
     */
    updateLineColor(lineId: number, color: [number, number, number, number]): void;
    /**
     * Updates the thickness for a specific line.
     */
    updateLineThickness(lineId: number, newThickness: number): void;
    /**
     * Enables or disables rendering of specific lines.
     */
    setLinesEnabled(lineIds: number[], enabled: boolean): void;
    /**
     * Enables or disables rendering of a single line.
     */
    setLineEnabled(lineId: number, enabled: boolean): void;
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
     * thickPlotter.setLogAxis(false, true);
     *
     * // Enable both axes for power-law data
     * thickPlotter.setLogAxis(true, true);
     *
     * // Disable all log scaling
     * thickPlotter.setLogAxis(false, false);
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
     * const bounds = thickPlotter.getDataBounds();
     * thickPlotter.transformToLogSpace(bounds);
     *
     * // Alternative: same result, preserves current coordinate space
     * thickPlotter.transformToLogSpace();
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
     * Updates only the Y coordinates of the points for a given line.
     */
    updateLineY(lineId: number, newY: Float32Array): void;
    /**
     * Helper method to update texture data row by row.
     * @param gl WebGL context
     * @param startIdx Starting global point index
     * @param numPts Number of points to update
     */
    private updateTextureByRows;
    /**
     * Draws the lines managed by this instance.
     */
    draw(): void;
    /**
     * Releases all WebGL resources allocated by this instance.
     */
    cleanup(): void;
    /**
     * Gets the configuration for a specific line by reading from the UBO data view.
     * Note: This returns a partial LineConfig as not all original data might be stored or easily retrievable.
     * Specifically, 'points' are on the GPU texture and not returned here.
     * @param lineId The ID of the line.
     * @returns A Partial<LineConfig> object or undefined if not found or UBO not ready.
     */
    getLineConfig(lineId: number): Partial<LineConfig> | undefined;
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
//# sourceMappingURL=WebglLineThick.d.ts.map