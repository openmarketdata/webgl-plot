export type DataBounds = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    coordinateSpace: {
        x: "linear" | "log";
        y: "linear" | "log";
    };
};
/**
 * Validates if a line has sufficient positive data to be meaningful for log axis auto-scaling.
 *
 * @param points Array of points in [x1,y1,x2,y2,...] format
 * @param logX Whether log X axis is enabled
 * @param logY Whether log Y axis is enabled
 * @returns Object with validation result and statistics
 */
export declare function validateLineForLogAxes(points: Float32Array, logX: boolean, logY: boolean): {
    isValid: boolean;
    validPointCount: number;
    totalPoints: number;
    validRatio: number;
};
/**
 * Calculates data bounds from points array in the appropriate coordinate space.
 * Filters invalid values for log axes and applies log transformation when enabled.
 *
 * @param points Array of points in [x1,y1,x2,y2,...] format
 * @param logX Whether log X axis is enabled - returns log10(x) values if true
 * @param logY Whether log Y axis is enabled - returns log10(y) values if true
 * @returns DataBounds object in the requested coordinate space, or null if no valid points found
 */
export declare function calculateLogAwareBounds(points: Float32Array, logX: boolean, logY: boolean): DataBounds | null;
/**
 * Calculates global transform parameters to fit bounds into NDC space [-1, 1].
 *
 * @param bounds Data bounds to fit
 * @returns Transform parameters [scaleX, scaleY, offsetX, offsetY]
 */
export declare function calculateAutoScaleTransform(bounds: DataBounds): [number, number, number, number];
/**
 * Transforms data bounds from linear space to log space.
 *
 * **Usage**: Convert linear coordinate bounds to logarithmic coordinate bounds.
 * This is used when switching from linear to log axes or when preparing bounds
 * for log-space calculations.
 *
 * @param bounds Linear space bounds (values in original data units)
 * @param logX Whether to transform X bounds to log₁₀ space
 * @param logY Whether to transform Y bounds to log₁₀ space
 * @returns Log space bounds (log₁₀ values) or null if transformation not possible
 *
 * @example
 * ```typescript
 * const linearBounds = { minX: 1, maxX: 1000, minY: 0.1, maxY: 100 };
 * const logBounds = transformBoundsToLogSpace(linearBounds, true, true);
 * // Result: { minX: 0, maxX: 3, minY: -1, maxY: 2 }
 * ```
 */
export declare function transformBoundsToLogSpace(bounds: DataBounds, logX: boolean, logY: boolean): DataBounds | null;
/**
 * Transforms data bounds from log space back to linear space.
 *
 * **Usage**: Convert logarithmic coordinate bounds back to linear coordinate bounds.
 * This is the inverse operation of transformBoundsToLogSpace() and is used when
 * switching from log back to linear axes while preserving the current view.
 *
 * @param bounds Log space bounds (log₁₀ values)
 * @param logX Whether X bounds are currently in log₁₀ space and need conversion
 * @param logY Whether Y bounds are currently in log₁₀ space and need conversion
 * @returns Linear space bounds (values in original data units)
 *
 * @example
 * ```typescript
 * const logBounds = { minX: 0, maxX: 3, minY: -1, maxY: 2 };
 * const linearBounds = transformBoundsToLinearSpace(logBounds, true, true);
 * // Result: { minX: 1, maxX: 1000, minY: 0.1, maxY: 100 }
 * ```
 */
export declare function transformBoundsToLinearSpace(bounds: DataBounds, logX: boolean, logY: boolean): DataBounds;
/**
 * Reverses a global transform to find the data space bounds that correspond to NDC [-1, 1].
 *
 * @param globalScale Global scale [scaleX, scaleY]
 * @param globalOffset Global offset [offsetX, offsetY]
 * @param logX Whether X axis is in log space
 * @param logY Whether Y axis is in log space
 * @returns Data space bounds that map to NDC [-1, 1] with coordinate space information
 */
export declare function reverseGlobalTransform(globalScale: [number, number], globalOffset: [number, number], logX: boolean, logY: boolean): DataBounds;
//# sourceMappingURL=LogAxisUtils.d.ts.map