"""Reflex wrapper for the webgl-plot declarative plot() API."""

import os

import reflex as rx

# npm package installed from GitHub (no npm publish needed). The `release`
# branch holds prebuilt dist/ (bun, used by Reflex, does not run `prepare`
# for git dependencies). The /react subpath exports <WebglPlotFigure>.
# Override with REFLEX_WEBGL_PLOT_JS to develop against another ref or a
# local build, e.g. "file:/path/to/webgl-plot/release".
JS_SPEC = os.environ.get("REFLEX_WEBGL_PLOT_JS", "github:openmarketdata/webgl-plot#release")


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

    library = f"@openmarketdata/webgl-plot/react@{JS_SPEC}"

    tag = "WebglPlotFigure"

    # Plot configuration: {"type", "x-range", "y-range", "data", "backgroundColor", "markerSize"}.
    # Series may set their own "type": line | scatter | segments | bubble | bar.
    config: rx.Var[dict]

    # Canvas size in pixels (ignored when auto_resize is set).
    width: rx.Var[int]
    height: rx.Var[int]

    # Fill the parent element and refit the drawing buffer on resize.
    auto_resize: rx.Var[bool]


webgl_plot_figure = WebglPlotFigure.create
