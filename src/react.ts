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
  /**
   * Size the canvas to fill its parent (CSS width/height 100%) and refit the
   * drawing buffer whenever the element is resized. `width`/`height` are ignored.
   */
  autoResize?: boolean;
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
    const canvas = canvasRef.current;
    if (!props.autoResize || !canvas) return;
    const observer = new ResizeObserver(() => figureRef.current?.resize());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [props.autoResize]);

  useEffect(() => {
    return () => {
      figureRef.current?.destroy();
      figureRef.current = null;
    };
  }, []);

  const style: CSSProperties | undefined = props.autoResize
    ? { display: "block", width: "100%", height: "100%", ...props.style }
    : props.style;

  return createElement("canvas", {
    ref: canvasRef,
    width: props.autoResize ? undefined : props.width ?? 800,
    height: props.autoResize ? undefined : props.height ?? 600,
    style,
    className: props.className,
  });
}
