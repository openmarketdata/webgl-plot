"""Reflex wrapper for the network-flow canvas in assets/netflow.js."""

import reflex as rx


class NetFlow(rx.Component):
    """Clients -> BTS hub -> brokers topology with animated routing particles."""

    library = "$/public/netflow.js"
    tag = "NetFlow"

    # routing events [{id, kind, client, broker}]; new ids launch particles
    events: rx.Var[list[dict]]

    # {inflight, legIn, legOut}, reported once per second
    on_stats: rx.EventHandler[rx.event.passthrough_event_spec(dict)]


net_flow = NetFlow.create
