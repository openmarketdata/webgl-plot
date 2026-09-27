/**
 * WebGL Helper Functions
 *
 * Pure utility functions for common WebGL operations that users can use
 * when managing their own WebGL2 context instead of using WebglPlot wrapper.
 */
export type WebGL2ContextOptions = {
    antialias?: boolean;
    transparent?: boolean;
    powerPerformance?: "default" | "high-performance" | "low-power";
    deSync?: boolean;
    preserveDrawing?: boolean;
};
/**
 * Set up canvas with proper pixel ratio scaling
 * @param canvas HTMLCanvasElement to configure
 * @param devicePixelRatio Optional device pixel ratio, defaults to window.devicePixelRatio || 1
 */
export declare function setupCanvas(canvas: HTMLCanvasElement, devicePixelRatio?: number): void;
/**
 * Create a WebGL2 rendering context with common options
 * @param canvas HTMLCanvasElement to get context from
 * @param options WebGL context creation options
 * @returns WebGL2RenderingContext
 * @throws Error if WebGL2 is not supported or context creation fails
 */
export declare function createWebGL2Context(canvas: HTMLCanvasElement, options?: WebGL2ContextOptions): WebGL2RenderingContext;
/**
 * Set the background clear color for WebGL context
 * @param gl WebGL2 rendering context
 * @param color Either:
 *   - CSS color string in format "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1
 *   - Array of [r, g, b, a] where all values are 0-1
 *   - Individual RGBA values (r, g, b, a)
 * @example
 * setBackgroundColor(gl, "rgba(25, 0, 100, 1)");
 * setBackgroundColor(gl, [0.1, 0, 0.4, 1]);
 * setBackgroundColor(gl, 0.1, 0, 0.4, 1);
 */
export declare function setBackgroundColor(gl: WebGL2RenderingContext, color: string | [number, number, number, number]): void;
export declare function setBackgroundColor(gl: WebGL2RenderingContext, r: number, g: number, b: number, a: number): void;
/**
 * Clear the canvas with the current clear color
 * @param gl WebGL2 rendering context
 * @param backgroundColor Optional background color to set before clearing
 */
export declare function clearCanvas(gl: WebGL2RenderingContext, backgroundColor?: string | [number, number, number, number]): void;
/**
 * Update WebGL viewport when canvas size changes
 * @param gl WebGL2 rendering context
 * @param canvas HTMLCanvasElement to get dimensions from
 */
export declare function updateViewport(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void;
/**
 * Create a combined setup function that handles both canvas and WebGL context
 * @param canvas HTMLCanvasElement to set up
 * @param options Configuration options
 * @returns WebGL2RenderingContext ready for use
 */
export declare function setupCanvasAndWebGL(canvas: HTMLCanvasElement, options?: WebGL2ContextOptions & {
    devicePixelRatio?: number;
    backgroundColor?: string | [number, number, number, number];
}): WebGL2RenderingContext;
/**
 * Resize handler that updates both canvas and WebGL viewport
 * Useful for window resize events or responsive layouts
 * @param canvas HTMLCanvasElement to resize
 * @param gl WebGL2 rendering context
 * @param devicePixelRatio Optional device pixel ratio
 */
export declare function handleCanvasResize(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, devicePixelRatio?: number): void;
//# sourceMappingURL=WebGLHelpers.d.ts.map