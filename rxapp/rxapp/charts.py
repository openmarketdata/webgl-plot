"""Turn bucketed market data into webgl-plot `plot()` configs.

All four charts share the x axis: one unit per bucket, bucket i centred on
x = i, so x-range is [-0.5, N_BUCKETS - 0.5] for every figure (ui7's shared
xMap). Axis labels are rendered as HTML by the page, so each builder also
returns their text and position (percent from top / from left).
"""

from __future__ import annotations

import math
import time
from typing import TypedDict

from .sim import N_BUCKETS, Bucket

RGBA = list[float]

X_RANGE = [-0.5, N_BUCKETS - 0.5]
BG = "rgba(18, 21, 29, 1)"
GRID: RGBA = [0.106, 0.129, 0.188, 1.0]  # #1b2130
MID_LINE: RGBA = [0.165, 0.188, 0.251, 1.0]  # #2a3040
GREEN = (52, 211, 153)
RED = (251, 113, 133)
BLUE = (96, 165, 250)
AMBER = (251, 191, 36)
CYAN = (34, 211, 238)


def rgba(rgb: tuple[int, int, int], a: float) -> RGBA:
    return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, a]


# valid plot() config with nothing to draw; used until the first tick arrives
EMPTY: dict = {
    "type": "line",
    "x-range": X_RANGE,
    "y-range": [0, 1],
    "data": {"x": [], "y": []},
    "backgroundColor": BG,
}


class Label(TypedDict):
    text: str
    pos: float


def time_labels(bks: list[Bucket], every: int = 5) -> list[Label]:
    out: list[Label] = []
    for i, b in enumerate(bks):
        if i % every:
            continue
        out.append({"text": time.strftime("%M:%S", time.localtime(b.t0)), "pos": (i + 0.5) / N_BUCKETS * 100})
    return out


def _time_grid(y0: float, y1: float, every: int = 5) -> dict:
    xs: list[float] = []
    ys: list[float] = []
    for i in range(0, N_BUCKETS, every):
        xs += [i, i]
        ys += [y0, y1]
    return {"type": "segments", "x": xs, "y": ys, "color": GRID}


def _r(v: float) -> float:
    return round(v, 4)


def baf(bks: list[Bucket]) -> tuple[dict, list[Label]]:
    """Bid/ask ticks per bucket, mid line and one fill bubble at the VWAP."""
    mn, mx, max_vol = math.inf, -math.inf, 1.0
    for b in bks:
        if b.n_quotes:
            mn, mx = min(mn, b.bid_min), max(mx, b.ask_max)
        if b.fill_vol:
            max_vol = max(max_vol, b.fill_vol)
    if not math.isfinite(mn):
        mn, mx = 0.0, 1.0
    r = (mx - mn) or 1.0
    # ui7 pads 10px top / 16px bottom on a ~150px chart
    y_top, y_bot = mx + r * 0.08, mn - r * 0.12
    span = y_top - y_bot

    grid = _time_grid(y_bot, y_top)
    gx: list[float] = []
    gy: list[float] = []
    ylabels: list[Label] = []
    for i in range(5):
        v = mx - r * i / 4
        gx += X_RANGE
        gy += [v, v]
        ylabels.append({"text": f"{v:.2f}", "pos": (y_top - v) / span * 100})

    bid_x: list[float] = []
    bid_y: list[float] = []
    ask_x: list[float] = []
    ask_y: list[float] = []
    mid_x: list[float] = []
    mid_y: list[float] = []
    fx: list[float] = []
    fy: list[float] = []
    sizes: list[float] = []
    colors: list[RGBA] = []
    for i, b in enumerate(bks):
        if not b.n_quotes:
            continue
        # quotes at the same cent overlap exactly; draw each distinct price once
        for p in {round(v, 2) for v in b.bids}:
            bid_x += [i - 0.37, i - 0.03]
            bid_y += [p, p]
        for p in {round(v, 2) for v in b.asks}:
            ask_x += [i + 0.03, i + 0.37]
            ask_y += [p, p]
        mid_x.append(i)
        mid_y.append(_r((b.bid_max + b.ask_min) / 2))
        if b.fill_vol:
            g = b.buy_ratio
            fx.append(i)
            fy.append(_r(b.fill_vwap))
            sizes.append(_r(3 + math.sqrt(b.fill_vol / max_vol) * 9))
            colors.append([(251 - g * 199) / 255, (113 + g * 98) / 255, (133 + g * 20) / 255, 0.75])

    cfg = {
        "backgroundColor": BG,
        "x-range": X_RANGE,
        "y-range": [_r(y_bot), _r(y_top)],
        "data": [
            grid,
            {"type": "segments", "x": gx, "y": gy, "color": GRID},
            {"type": "segments", "x": bid_x, "y": bid_y, "color": rgba(GREEN, 0.45)},
            {"type": "segments", "x": ask_x, "y": ask_y, "color": rgba(RED, 0.45)},
            {"type": "line", "x": mid_x, "y": mid_y, "color": rgba(CYAN, 0.45), "thickness": 1},
            {"type": "bubble", "x": fx, "y": fy, "sizes": sizes, "colors": colors},
        ],
    }
    return cfg, ylabels


def imbalance(bks: list[Bucket]) -> dict:
    xs: list[float] = []
    ys: list[float] = []
    colors: list[RGBA] = []
    for i, b in enumerate(bks):
        if b.imb is None:
            continue
        xs.append(i)
        ys.append(_r(b.imb if abs(b.imb) > 0.02 else math.copysign(0.02, b.imb)))
        colors.append(rgba(GREEN if b.imb >= 0 else RED, 0.7))
    return {
        "backgroundColor": BG,
        "x-range": X_RANGE,
        "y-range": [-1.06, 1.06],
        "data": [
            _time_grid(-1.06, 1.06),
            {"type": "segments", "x": X_RANGE, "y": [0, 0], "color": MID_LINE},
            {"type": "bar", "x": xs, "y": ys, "width": 0.6, "colors": colors},
        ],
    }


def spread(bks: list[Bucket]) -> tuple[dict, float, float | None]:
    """Returns (config, axis max, latest value)."""
    xs: list[float] = []
    ys: list[float] = []
    for i, b in enumerate(bks):
        if b.avg_spread_bps is not None:
            xs.append(i)
            ys.append(_r(b.avg_spread_bps))
    mx = max(ys, default=1.0)
    mx = max(mx, 1.0)
    # ui7: 0 sits 14px above the bottom, mx 8px below the top
    y_bot, y_top = -mx * 0.08, mx * 1.1
    cfg = {
        "backgroundColor": BG,
        "x-range": X_RANGE,
        "y-range": [_r(y_bot), _r(y_top)],
        "data": [
            _time_grid(y_bot, y_top),
            {"type": "line", "x": xs, "y": ys, "color": rgba(AMBER, 1.0), "thickness": 1.5},
            {"type": "bubble", "x": xs, "y": ys, "sizes": [2.0] * len(xs), "color": rgba(AMBER, 1.0)},
        ],
    }
    return cfg, mx, ys[-1] if ys else None


def quote_freq(bks: list[Bucket]) -> tuple[dict, int, int]:
    """Returns (config, axis max, latest bucket count)."""
    counts = [b.n_quotes for b in bks]
    mx = max(max(counts), 1)
    y_top = mx * 1.1
    cfg = {
        "backgroundColor": BG,
        "x-range": X_RANGE,
        "y-range": [-mx * 0.08, _r(y_top)],
        "data": [
            _time_grid(-mx * 0.08, y_top),
            {
                "type": "bar",
                "x": list(range(N_BUCKETS)),
                "y": [max(c, mx * 0.01) for c in counts],
                "width": 0.6,
                "color": rgba(BLUE, 0.65),
            },
        ],
    }
    return cfg, mx, counts[-1]
