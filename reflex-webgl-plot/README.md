# reflex-webgl-plot

Reflex custom component wrapping the `@openmarketdata/webgl-plot` declarative `plot()` API.

The JS dependency is installed straight from GitHub at frontend build time — no npm publish required. It points at the `release` branch, which the [release-branch workflow](../.github/workflows/release-branch.yml) rebuilds from `webglplot-v2` on every push (Reflex installs frontend packages with bun, which does not run a git dependency's `prepare` script, so the built `dist/` must already be committed on the installed ref).

## Install

```bash
pip install git+https://github.com/openmarketdata/webgl-plot.git#subdirectory=reflex-webgl-plot
# or from a local checkout:
pip install ./reflex-webgl-plot
```

## Usage

```python
import reflex as rx
from reflex_webgl_plot import webgl_plot_figure

def index() -> rx.Component:
    return webgl_plot_figure(
        config={
            "type": "line",
            "x-range": [-10, 10],
            "data": {"x": [1, 2, 3], "y": [2, 4, 6]},
        },
        width=800,
        height=600,
    )
```

`config` accepts the same JSON shape as `plot()` (`type`, `x-range`, `y-range`, `data` as a single series or list of series, `backgroundColor`, `markerSize`). Changing `config` from Reflex state re-renders the figure via `figure.update()`.
