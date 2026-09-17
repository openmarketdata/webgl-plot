import { ColorRGBA } from './ColorRGBA';
/**
 * @deprecated Use WebglLinePlot instead.
 */
export declare class WebglLine {
    xy: number[];
    color: ColorRGBA;
    constructor(xy?: number[], color?: ColorRGBA);
    getSize(): number;
    setY(y: number): void;
    setYs(ys: number[]): void;
    setXYArray(xy: number[]): void;
    setX(x: number): void;
    lineSpaceX(lineSize: number): void;
    emptyLine(lineSize: number): void;
    setColor(color: ColorRGBA): void;
}
//# sourceMappingURL=WebglLine.d.ts.map