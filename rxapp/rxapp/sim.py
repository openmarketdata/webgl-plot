"""Market-data and order-routing simulation (port of the JS in ui7.html).

A single `FlowSim` instance is shared by every connected browser; each
client's Reflex state calls `step()` on its tick and then derives the view
for its own symbol / resolution / filter with `buckets()` and friends.
"""

from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass, field

N_CLIENTS = 9
N_BROKERS = 5
N_BUCKETS = 40
CLIENTS = [f"CL-{101 + i}" for i in range(N_CLIENTS)]
BROKERS = ["GSCO", "MSCO", "JPMS", "UBSW", "BARX"]
SYMS = {"NVDA": 178.55, "AAPL": 232.40, "SPY": 645.75, "TSLA": 341.20}
RESOLUTIONS = (5, 15, 30)
FILTERS = ("ALL", "NEW", "PARTIAL", "FILLED", "CANCELLED", "REJECTED")
MAX_ORDERS = 100
WINDOW_S = 31 * N_BUCKETS  # keep enough history for the 30s resolution

# ui7 interval rates, expressed per second
QUOTE_RATE = 1.5 / 0.12  # quote() + 50% chance of a 2nd quote every 120ms
FILL_RATE = 0.55 / 0.28
ORDER_RATE = 0.8 / 0.7
PARTIAL_PERIOD = 1.2
CHATTER_PERIOD = 0.4


@dataclass
class Quote:
    t: float
    bid: float
    ask: float


@dataclass
class Fill:
    t: float
    px: float
    sz: float
    side: str


@dataclass
class SymState:
    mid: float
    quotes: list[Quote] = field(default_factory=list)
    fills: list[Fill] = field(default_factory=list)


@dataclass
class Order:
    id: str
    time: float
    client: str
    broker: str
    sym: str
    side: str
    qty: int
    px: float
    filled: int = 0
    avg: float = 0.0
    status: str = "NEW"
    is_new: bool = True
    respond_at: float = 0.0  # when the broker answers the NEW order


@dataclass
class Bucket:
    t0: float
    bids: list[float] = field(default_factory=list)
    asks: list[float] = field(default_factory=list)
    fills: list[Fill] = field(default_factory=list)
    bid_min: float = 0.0
    bid_max: float = 0.0
    ask_min: float = 0.0
    ask_max: float = 0.0
    avg_spread_bps: float | None = None
    fill_vol: float = 0.0
    fill_vwap: float = 0.0
    buy_ratio: float = 0.0
    imb: float | None = None

    @property
    def n_quotes(self) -> int:
        return len(self.bids)


def _trade_size() -> int:
    if random.random() < 0.06:
        return (random.randrange(8) + 2) * 1000
    return (random.randrange(15) + 1) * 100


class FlowSim:
    def __init__(self) -> None:
        self.syms = {k: SymState(mid=v) for k, v in SYMS.items()}
        self.orders: list[Order] = []
        self.oid = 71000
        # routing events for the network canvas; consumed by the frontend by id
        self.events: list[dict] = []
        self.event_id = 0
        now = time.time()
        self.last_step = now
        self.next_partial = now + PARTIAL_PERIOD
        self.next_chatter = now + CHATTER_PERIOD
        self._seed(now)
        for _ in range(10):
            self._new_order(now)

    # ------------------------------------------------------------ market data
    def _quote(self, k: str, t: float) -> Quote:
        s = self.syms[k]
        s.mid = max(0.01, s.mid * (1 + (random.random() - 0.5) * 0.0011))
        bps = 0.4 + abs(math.sin(t / 9 + len(k))) * 1.6 + random.random() * 0.8
        half = s.mid * bps / 1e4 / 2
        q = Quote(t, s.mid - half, s.mid + half)
        s.quotes.append(q)
        return q

    def _mkt_fill(self, k: str, t: float) -> None:
        s = self.syms[k]
        if not s.quotes:
            return
        q = s.quotes[-1]
        side = "B" if random.random() > 0.5 else "S"
        s.fills.append(Fill(t, q.ask if side == "B" else q.bid, _trade_size(), side))

    def _trim(self, now: float) -> None:
        cutoff = now - WINDOW_S
        for s in self.syms.values():
            i = 0
            while i < len(s.quotes) and s.quotes[i].t < cutoff:
                i += 1
            if i:
                del s.quotes[:i]
            i = 0
            while i < len(s.fills) and s.fills[i].t < cutoff:
                i += 1
            if i:
                del s.fills[:i]

    def _seed(self, now: float) -> None:
        for k, s in self.syms.items():
            t = now - WINDOW_S
            while t < now:
                q = self._quote(k, t)
                if random.random() < 0.35:
                    side = "B" if random.random() > 0.5 else "S"
                    s.fills.append(Fill(t, q.ask if side == "B" else q.bid, _trade_size(), side))
                t += 0.2 + random.random() * 0.3

    # ------------------------------------------------------------ orders/routing
    def _emit(self, kind: str, client: str, broker: str | None) -> None:
        self.event_id += 1
        self.events.append({"id": self.event_id, "kind": kind, "client": client, "broker": broker})
        if len(self.events) > 200:
            del self.events[: len(self.events) - 200]

    def _new_order(self, now: float) -> None:
        sym = random.choice(list(SYMS))
        o = Order(
            id=f"ORD-{self.oid}",
            time=now,
            client=random.choice(CLIENTS),
            broker=random.choice(BROKERS),
            sym=sym,
            side="BUY" if random.random() > 0.5 else "SELL",
            qty=(random.randrange(25) + 1) * 100,
            px=self.syms[sym].mid * (1 + (random.random() - 0.5) * 0.003),
            # two particle legs (~1.7s each) + broker think time 0.3..2.1s
            respond_at=now + 3.4 + 0.3 + random.random() * 1.8,
        )
        self.oid += 1
        self.orders.insert(0, o)
        del self.orders[MAX_ORDERS:]
        self._emit("order", o.client, o.broker)

    def _respond(self, o: Order) -> None:
        rnd = random.random()
        kind = "fill" if rnd < 0.72 else "reject" if rnd < 0.86 else "cancel"
        if kind == "fill":
            o.filled = max(100, math.floor(o.qty * (0.2 + random.random() * 0.8) / 100) * 100)
            o.avg = o.px * (1 + (random.random() - 0.5) * 0.0005)
            o.status = "FILLED" if o.filled >= o.qty else "PARTIAL"
        else:
            o.status = "REJECTED" if kind == "reject" else "CANCELLED"
        o.is_new = True
        self._emit(kind, o.client, o.broker)

    def _progress_partials(self) -> None:
        for o in self.orders:
            if o.status != "PARTIAL" or random.random() >= 0.4:
                continue
            o.filled = min(o.qty, o.filled + math.floor(o.qty * random.random() / 100) * 100 + 100)
            if o.filled >= o.qty:
                o.filled = o.qty
                o.status = "FILLED"
            o.is_new = True
            self._emit("fill", o.client, o.broker)

    def _chatter(self) -> None:
        if random.random() < 0.6:
            self._emit("chatter_in", random.choice(CLIENTS), None)
        if random.random() < 0.5:
            self._emit("chatter_out", "", random.choice(BROKERS))

    # ------------------------------------------------------------ clock
    def step(self, now: float | None = None) -> None:
        """Advance the simulation from the last step to `now`."""
        now = time.time() if now is None else now
        dt = now - self.last_step
        if dt <= 0:
            return
        dt = min(dt, 5.0)  # don't replay a long gap
        t0 = now - dt
        for o in self.orders:
            o.is_new = False
        for k in self.syms:
            for _ in range(_poisson(QUOTE_RATE * dt)):
                self._quote(k, t0 + random.random() * dt)
            for _ in range(_poisson(FILL_RATE * dt)):
                self._mkt_fill(k, t0 + random.random() * dt)
        for s in self.syms.values():
            s.quotes.sort(key=lambda q: q.t)
            s.fills.sort(key=lambda f: f.t)
        self._trim(now)
        for _ in range(_poisson(ORDER_RATE * dt)):
            self._new_order(now)
        for o in self.orders:
            if o.status == "NEW" and o.respond_at and now >= o.respond_at:
                o.respond_at = 0.0
                self._respond(o)
        while now >= self.next_partial:
            self.next_partial += PARTIAL_PERIOD
            self._progress_partials()
        while now >= self.next_chatter:
            self.next_chatter += CHATTER_PERIOD
            self._chatter()
        self.last_step = now

    # ------------------------------------------------------------ views
    def buckets(self, sym: str, res: int, now: float | None = None) -> list[Bucket]:
        now = time.time() if now is None else now
        s = self.syms[sym]
        end = math.floor(now / res) * res
        out = [Bucket(t0=end - i * res) for i in range(N_BUCKETS - 1, -1, -1)]
        first = out[0].t0
        for q in s.quotes:
            i = math.floor((q.t - first) / res)
            if 0 <= i < N_BUCKETS:
                out[i].bids.append(q.bid)
                out[i].asks.append(q.ask)
        for f in s.fills:
            i = math.floor((f.t - first) / res)
            if 0 <= i < N_BUCKETS:
                out[i].fills.append(f)
        for b in out:
            if b.bids:
                b.bid_min, b.bid_max = min(b.bids), max(b.bids)
                b.ask_min, b.ask_max = min(b.asks), max(b.asks)
                b.avg_spread_bps = sum(
                    (a - bd) / ((a + bd) / 2) * 1e4 for a, bd in zip(b.asks, b.bids)
                ) / len(b.bids)
            if b.fills:
                vol = sum(f.sz for f in b.fills)
                buy = sum(f.sz for f in b.fills if f.side == "B")
                b.fill_vol = vol
                b.fill_vwap = sum(f.px * f.sz for f in b.fills) / vol
                b.buy_ratio = buy / vol
                b.imb = buy / vol * 2 - 1
        return out

    def events_since(self, last_id: int) -> list[dict]:
        return [e for e in self.events if e["id"] > last_id]


def _poisson(lam: float) -> int:
    if lam <= 0:
        return 0
    if lam > 30:
        return max(0, round(random.gauss(lam, math.sqrt(lam))))
    limit = math.exp(-lam)
    k = 0
    p = 1.0
    while True:
        p *= random.random()
        if p < limit:
            return k
        k += 1


SIM = FlowSim()
