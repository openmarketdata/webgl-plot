import { ColorRGBA } from './ColorRGBA';
/**
 * The standard Line class
 */
export declare class WebglScatterAcc {
    private headIndex;
    private color;
    private squareSize;
    private maxSquare;
    private gl;
    private squareIndices;
    private colorsBuffer;
    private positionBuffer;
    prog: WebGLProgram;
    private attrPosLocation;
    private attrColorLocation;
    constructor(gl: WebGL2RenderingContext, maxSquare: number);
    setColor(color: ColorRGBA): void;
    setSquareSize(squareSize: number): void;
    setScale(scaleX: number, scaleY: number): void;
    setOffset(offsetX: number, offsetY: number): void;
    addSquare(pos: Float32Array, color: Uint8Array): void;
    draw(): void;
}
//# sourceMappingURL=WebglScatterAcc.d.ts.map