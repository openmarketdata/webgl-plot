import { ColorRGBA } from './ColorRGBA';
export declare class WebglLineRoll {
    private gl;
    private aPositionLocation;
    private vertexBuffer;
    program: WebGLProgram;
    rollBufferSize: number;
    private shift;
    private dataIndex;
    private dataX;
    private lastDataX;
    private lastDataY;
    numLines: number;
    private filled;
    private ext;
    private colorBuffer;
    private aColorLocation;
    private uShiftLocation;
    private uploadScratch;
    private bridgeScratch;
    private multiFirsts;
    private multiCounts;
    constructor(gl: WebGL2RenderingContext, rollBufferSize: number, numLines: number);
    addPoint(ys: number[]): void;
    addPoints(ys: ReadonlyArray<ArrayLike<number>>): void;
    private drawOld;
    private drawExt;
    draw(): void;
    setLineColor(colors: ColorRGBA, lineIndex: number): void;
}
//# sourceMappingURL=WebglLineRoll.d.ts.map