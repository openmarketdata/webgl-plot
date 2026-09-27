import { ColorRGBA } from './ColorRGBA';
import { WebglAux } from './WebglAux';
import { WebglScatterAcc } from './WebglScatterAcc';
import { WebglLine } from './WebglLine';
import { WebglLineRoll } from './WebglLineRoll';
import { WebglLinePlot } from './WebglLinePlot';
import { WebglLineThick } from './WebglLineThick';
import { WebglPolygonPlot, PolygonConfig } from './WebglPolygonPlot';
import { WebglSegments } from './WebglSegments';
import { WebglDots } from './WebglDots';
import { UnifiedLinePlot } from './UnifiedLinePlot';
import { LineConfig } from './LineConfig';
import { DebugLogger } from './DebugLogger';
export type { LineConfig, PolygonConfig };
export { setupCanvas, createWebGL2Context, setBackgroundColor, clearCanvas, updateViewport, setupCanvasAndWebGL, handleCanvasResize, } from './WebGLHelpers';
import * as WebGLHelpers from "./WebGLHelpers";
export { WebGLHelpers };
export { UnifiedLinePlot, WebglLinePlot, WebglLineThick, WebglScatterAcc, WebglPolygonPlot, WebglSegments, WebglDots, WebglLine, WebglLineRoll, WebglAux, ColorRGBA, DebugLogger, };
export { plot, type PlotConfig, type PlotSeries, type PlotType, type PlotUpdate, type PlotHandle, } from './plot';
export { transformBoundsToLogSpace, transformBoundsToLinearSpace, type DataBounds, } from './LogAxisUtils';
export declare class WebglPlot {
    readonly gl: WebGL2RenderingContext;
    gScaleX: number;
    gScaleY: number;
    gOffsetX: number;
    gOffsetY: number;
    logX: boolean;
    logY: boolean;
    debug: boolean;
    constructor(canvas: HTMLCanvasElement, options?: {
        antialias?: boolean;
        powerPerformance?: "default" | "high-performance" | "low-power";
        backgroundColor?: [number, number, number, number];
        debug?: boolean;
    });
    clear(): void;
    update(): void;
    newUnifiedLinePlotter(maxLines: number): UnifiedLinePlot;
    newThinLinePlotter(maxLines: number): WebglLinePlot;
    newThickLinePlotter(maxLines: number): WebglLineThick;
}
/**
 * webgl-plot v2 - High Performance 2D WebGL Plotting Library
 *
 * BREAKING CHANGE: WebglPlot class has been removed.
 *
 * NEW USAGE:
 * 1. Create WebGL2 context directly: const gl = canvas.getContext('webgl2')
 * 2. Use individual plotters: new UnifiedLinePlot(gl, maxLines)
 * 3. Use WebGLHelpers for common setup tasks
 *
 * Example:
 * ```typescript
 * import { setupCanvasAndWebGL, UnifiedLinePlot } from 'webgl-plot';
 *
 * const canvas = document.getElementById('canvas');
 * const gl = setupCanvasAndWebGL(canvas, { backgroundColor: [0, 0, 0, 1] });
 * const plotter = new UnifiedLinePlot(gl, 10);
 *
 * function render() {
 *   gl.clear(gl.COLOR_BUFFER_BIT);
 *   plotter.draw();
 *   requestAnimationFrame(render);
 * }
 * ```
 */
//# sourceMappingURL=webglplot.d.ts.map