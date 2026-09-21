"""Reflex state: drives the shared simulation and derives this client's view."""

from __future__ import annotations

import asyncio
import time

import reflex as rx

from . import charts
from .sim import FILTERS, N_BUCKETS, RESOLUTIONS, SIM, SYMS, Order

TICK_S = 0.5
MAX_ROWS = 30


def _row(o: Order) -> dict:
    return {
        "id": o.id,
        "time": time.strftime("%H:%M:%S", time.localtime(o.time)),
        "client": o.client,
        "broker": o.broker,
        "sym": o.sym,
        "side": o.side,
        "side_cls": o.side.lower(),
        "qty": f"{o.qty:,}",
        "filled": f"{o.filled:,}",
        "pct": f"{o.filled / o.qty * 100 if o.qty else 0:.0f}%",
        "px": f"{o.px:.2f}",
        "status": o.status,
        "row_cls": "new-row" if o.is_new else "",
    }


class FlowState(rx.State):
    symbols: list[str] = list(SYMS)
    resolutions: list[int] = list(RESOLUTIONS)
    filters: list[str] = list(FILTERS)

    symbol: str = "NVDA"
    res: int = 5
    status_filter: str = "ALL"

    # charts (webgl-plot configs) + HTML axis labels
    baf: dict = {}
    imb: dict = {}
    spr: dict = {}
    qr: dict = {}
    baf_ylabels: list[dict] = []
    spr_ylabels: list[dict] = []
    qr_ylabels: list[dict] = []
    time_labels: list[dict] = []
    spr_now: str = ""
    qr_now: str = ""

    # orders
    rows: list[dict] = []
    stats: str = ""

    # network flow
    net_events: list[dict] = []
    inflight: int = 0
    leg_in: int = 0
    leg_out: int = 0
    clock: str = ""

    _running: bool = False
    _last_event_id: int = 0

    @rx.var
    def baf_title(self) -> str:
        return f"{self.symbol} — Bid/Ask/Fills · {N_BUCKETS} × {self.res}s buckets"

    @rx.var
    def res_label(self) -> str:
        return f"window: {N_BUCKETS * self.res}s ({N_BUCKETS} marks)"

    def _refresh(self) -> None:
        now = time.time()
        bks = SIM.buckets(self.symbol, self.res, now)
        self.baf, self.baf_ylabels = charts.baf(bks)
        self.imb = charts.imbalance(bks)
        self.spr, spr_max, spr_last = charts.spread(bks)
        self.qr, qr_max, qr_last = charts.quote_freq(bks)
        self.time_labels = charts.time_labels(bks)
        self.spr_ylabels = [{"text": f"{spr_max:.1f}", "pos": 8.5}, {"text": "0", "pos": 93.0}]
        self.qr_ylabels = [{"text": str(qr_max), "pos": 8.5}]
        self.spr_now = f"{spr_last:.2f} bps" if spr_last is not None else ""
        self.qr_now = f"{qr_last} msgs"

        orders = SIM.orders
        self.rows = [
            _row(o) for o in orders if self.status_filter == "ALL" or o.status == self.status_filter
        ][:MAX_ROWS]
        c = {s: 0 for s in FILTERS}
        for o in orders:
            c[o.status] += 1
        self.stats = (
            f"{len(orders)} total · {c['NEW']} in-flight · {c['PARTIAL']} working · "
            f"{c['FILLED']} filled · {c['REJECTED']} rej"
        )

        self.net_events = SIM.events_since(self._last_event_id)
        if self.net_events:
            self._last_event_id = self.net_events[-1]["id"]
        self.clock = time.strftime("%H:%M:%S", time.localtime(now))

    @rx.event
    def pick_symbol(self, sym: str):
        self.symbol = sym
        self._refresh()

    @rx.event
    def pick_res(self, res: int):
        self.res = res
        self._refresh()

    @rx.event
    def pick_filter(self, f: str):
        self.status_filter = f
        self._refresh()

    @rx.event
    def net_stats(self, s: dict):
        self.inflight = int(s.get("inflight", 0))
        self.leg_in = int(s.get("legIn", 0))
        self.leg_out = int(s.get("legOut", 0))

    @rx.event
    def stop(self):
        self._running = False

    @rx.event(background=True)
    async def run(self):
        async with self:
            if self._running:
                return
            self._running = True
            # animate only the most recent routing activity for a late joiner
            self._last_event_id = max(0, SIM.event_id - 20)
            SIM.step()
            self._refresh()
        while True:
            await asyncio.sleep(TICK_S)
            async with self:
                if not self._running:
                    return
                SIM.step()
                self._refresh()
