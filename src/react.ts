/**
 * React bindings for the declarative plot() API.
 *
 * Exposes <WebglPlotFigure config={...}/> which renders a canvas, calls
 * plot(config) on mount, figure.update(changes) when config changes, and
 * destroy() on unmount. Intended for React apps and Python Reflex wrappers.
 */

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactElement,
} from "react";
import { plot, type PlotConfig, type PlotHandle, type PlotUpdate } from "./plot";

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

export function WebglPlotFigure(props: WebglPlotFigureProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const figureRef = useRef<PlotHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!figureRef.current) {
      figureRef.current = plot({ ...props.config, canvas });
    } else {
      figureRef.current.update(props.config as PlotUpdate);
    }
  }, [props.config]);

  useEffect(() => {
    return () => {
      figureRef.current?.destroy();
      figureRef.current = null;
    };
  }, []);

  return createElement("canvas", {
    ref: canvasRef,
    width: props.width ?? 800,
    height: props.height ?? 600,
    style: props.style,
    className: props.className,
  });
}
