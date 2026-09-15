/**
 * Batched renderer for many independent thin line segments (GL_LINES), each
 * with its own RGBA color, drawn in a single draw call.
 *
 * Segments live in a fixed-capacity ring buffer: once `maxSegments` have been
 * added, the oldest are overwritten. Coordinates are stored in data space and
 * mapped to clip space by a global scale/offset, so scrolling or rescaling only
 * touches uniforms.
 */
export declare class WebglSegments {
    private gl;
    private maxSegments;
    private head;
    private count;
    private positionBuffer;
    private colorBuffer;
    private vao;
    private prog;
    private uScale;
    private uOffset;
    private scale;
    private offset;
    private posScratch;
    private colorScratch;
    constructor(gl: WebGL2RenderingContext, maxSegments: number);
    /** Map data space to clip space: clip = data * scale + offset. */
    setGlobalTransform(scale: [number, number], offset: [number, number]): void;
    /**
     * Append a segment from (x0, y0) to (x1, y1) in data space.
     * @param color RGBA in 0..1
     */
    addSegment(x0: number, y0: number, x1: number, y1: number, color: [number, number, number, number]): void;
    /** Remove all segments (buffer contents are simply ignored). */
    clear(): void;
    get numSegments(): number;
    draw(): void;
    cleanup(): void;
}
export declare function createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram;
//# sourceMappingURL=WebglSegments.d.ts.map