import { WebglLine } from './WebglLine';
/**
 * The standard Line class
 */
export declare class WebglAux {
    private lines;
    private gl;
    private coord;
    private vbuffer;
    prog: WebGLProgram;
    constructor(gl: WebGL2RenderingContext);
    addLine(line: WebglLine): void;
    draw(): void;
}
//# sourceMappingURL=WebglAux.d.ts.map