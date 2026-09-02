"""Reflex wrapper for the webgl-plot declarative plot() API."""

import reflex as rx


class WebglPlotFigure(rx.NoSSRComponent):
    """A WebGL figure driven by a matplotlib-like JSON config.

    Example:
        webgl_plot_figure(
            config={
                "type": "line",
                "x-range": [-10, 10],
                "data": {"x": [1, 2, 3], "y": [2, 4, 6]},
            },
            width=800,
            height=600,
        )
    """

    # npm package installed from GitHub (no npm publish needed);
    # the /react subpath exports the <WebglPlotFigure> React component.
    library = "@openmarketdata/webgl-plot/react@github:openmarketdata/webgl-plot#webglplot-v2"

    tag = "WebglPlotFigure"

    # Plot configuration: {"type", "x-range", "y-range", "data", "backgroundColor", "markerSize"}
    config: rx.Var[dict]

    # Canvas size in pixels.
    width: rx.Var[int]
    height: rx.Var[int]


webgl_plot_figure = WebglPlotFigure.create
