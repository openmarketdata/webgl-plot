import { CSSProperties, ReactElement } from 'react';
import { PlotConfig, PlotHandle, PlotUpdate } from './plot';
export type { PlotConfig, PlotHandle, PlotUpdate };
export interface WebglPlotFigureProps {
    /** Plot configuration (same JSON shape as plot(), minus canvas). */
    config: Omit<PlotConfig, "canvas">;
    /** Canvas width in pixels. Default 800. */
    width?: number;
    /** Canvas height in pixels. Default 600. */
    height?: number;
    style?: CSSProperties;
    className?: string;
}
export declare function WebglPlotFigure(props: WebglPlotFigureProps): ReactElement;
//# sourceMappingURL=react.d.ts.map