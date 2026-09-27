/**
 * Instanced renderer for anti-aliased round dots, each with its own position,
 * pixel radius and RGBA color, drawn in a single draw call.
 *
 * Dots live in a fixed-capacity ring buffer: once `maxDots` have been added,
 * the oldest are overwritten. Positions are stored in data space and mapped to
 * clip space by a global scale/offset; radii are in device pixels so dots keep
 * their size when the transform changes.
 */
export declare class WebglDots {
    private gl;
    private maxDots;
    private head;
    private count;
    private cornerBuffer;
    private positionBuffer;
    private radiusBuffer;
    private colorBuffer;
    private vao;
    private prog;
    private uScale;
    private uOffset;
    private uResolution;
    private scale;
    private offset;
    private posScratch;
    private radiusScratch;
    private colorScratch;
    constructor(gl: WebGL2RenderingContext, maxDots: number);
    /** Map data space to clip space: clip = data * scale + offset. */
    setGlobalTransform(scale: [number, number], offset: [number, number]): void;
    /**
     * Append a dot at (x, y) in data space.
     * @param radius radius in device pixels
     * @param color RGBA in 0..1
     */
    addDot(x: number, y: number, radius: number, color: [number, number, number, number]): void;
    /** Remove all dots (buffer contents are simply ignored). */
    clear(): void;
    get numDots(): number;
    draw(): void;
    cleanup(): void;
}
//# sourceMappingURL=WebglDots.d.ts.map