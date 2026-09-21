"""FlowNet — order-routing topology dashboard (Reflex port of ui7.html)."""

import reflex as rx
from reflex_webgl_plot import webgl_plot_figure

from .netflow import net_flow
from .state import FlowState

ORDER_COLUMNS = ["ID", "Time", "Client", "Broker", "Sym", "Side", "Qty", "Filled", "Px", "Status"]


def header() -> rx.Component:
    return rx.el.header(
        rx.el.span("⬡ FLOWNET", class_name="logo"),
        rx.el.div(
            rx.foreach(
                FlowState.symbols,
                lambda k: rx.el.button(
                    k,
                    on_click=FlowState.pick_symbol(k),
                    class_name=rx.cond(FlowState.symbol == k, "on", ""),
                ),
            ),
            class_name="sym-pick",
        ),
        rx.el.div(
            rx.foreach(
                FlowState.resolutions,
                lambda r: rx.el.button(
                    f"{r}s",
                    on_click=FlowState.pick_res(r),
                    class_name=rx.cond(FlowState.res == r, "on", ""),
                ),
            ),
            class_name="res-pick",
        ),
        rx.el.span(FlowState.res_label, class_name="res-lbl"),
        rx.el.div(
            rx.el.span("IN-FLIGHT ", rx.el.b(FlowState.inflight)),
            rx.el.span("CLIENT LEG ", rx.el.b(f"{FlowState.leg_in}/s")),
            rx.el.span("BROKER LEG ", rx.el.b(f"{FlowState.leg_out}/s")),
            rx.el.span(rx.el.b(FlowState.clock)),
            class_name="hstat",
        ),
    )


def network_box() -> rx.Component:
    return rx.el.div(
        rx.el.div(
            rx.el.span("Network Flow — Order Routing"),
            rx.el.span(
                rx.el.span("● order", class_name="c-blue"),
                " · ",
                rx.el.span("● fill/ack", class_name="c-green"),
                " · ",
                rx.el.span("● reject", class_name="c-red"),
                " · ",
                rx.el.span("● cancel", class_name="c-amber"),
                class_name="lg",
            ),
            class_name="hd",
        ),
        rx.el.div(
            net_flow(events=FlowState.net_events, on_stats=FlowState.net_stats),
            class_name="cvw",
        ),
        class_name="box net-box",
    )


def axis_label(l: rx.Var[dict], side: str) -> rx.Component:
    return rx.el.span(l["text"], style={side: f"{l['pos']}%"})


def chart_box(
    cls: str,
    title: rx.Var[str] | str,
    legend: rx.Component,
    config: rx.Var[dict],
    ylabels: rx.Var[list[dict]],
) -> rx.Component:
    return rx.el.div(
        rx.el.div(rx.el.span(title), legend, class_name="hd"),
        rx.el.div(
            rx.el.div(webgl_plot_figure(config=config, auto_resize=True), class_name="plot"),
            rx.el.div(rx.foreach(ylabels, lambda l: axis_label(l, "top")), class_name="yax"),
            rx.el.div(rx.foreach(FlowState.time_labels, lambda l: axis_label(l, "left")), class_name="tax"),
            class_name="cvw",
        ),
        class_name=f"box {cls}",
    )


def charts() -> rx.Component:
    return rx.el.div(
        chart_box(
            "baf-box",
            FlowState.baf_title,
            rx.el.span(
                rx.el.span("— bid px", class_name="c-green"),
                " · ",
                rx.el.span("— ask px", class_name="c-red"),
                " · ● fills @ VWAP",
                class_name="lg",
            ),
            FlowState.baf,
            FlowState.baf_ylabels,
        ),
        chart_box(
            "imb-box",
            "Trade Imbalance / bucket",
            rx.el.span(rx.el.span("buy", class_name="up"), " / ", rx.el.span("sell", class_name="down"), class_name="lg"),
            FlowState.imb,
            rx.Var.create([{"text": "+100%", "pos": 6.0}, {"text": "-100%", "pos": 94.0}]),
        ),
        chart_box(
            "spr-box",
            "Spread Width (avg bps / bucket)",
            rx.el.span(FlowState.spr_now, class_name="lg"),
            FlowState.spr,
            FlowState.spr_ylabels,
        ),
        chart_box(
            "qr-box",
            "Quote Frequency (msgs / bucket)",
            rx.el.span(FlowState.qr_now, class_name="lg"),
            FlowState.qr,
            FlowState.qr_ylabels,
        ),
        class_name="charts",
    )


def order_row(o: rx.Var[dict]) -> rx.Component:
    return rx.el.tr(
        rx.el.td(o["id"], class_name="c-dim"),
        rx.el.td(o["time"]),
        rx.el.td(o["client"], class_name="c-blue"),
        rx.el.td(o["broker"], class_name="c-violet"),
        rx.el.td(rx.el.b(o["sym"])),
        rx.el.td(o["side"], class_name=o["side_cls"].to(str)),
        rx.el.td(o["qty"]),
        rx.el.td(o["filled"], " ", rx.el.span(rx.el.i(style={"width": o["pct"]}), class_name="progress")),
        rx.el.td(o["px"]),
        rx.el.td(rx.el.span(o["status"], class_name=f"pill {o['status']}")),
        class_name=o["row_cls"].to(str),
    )


def orders_box() -> rx.Component:
    return rx.el.div(
        rx.el.div(rx.el.span("Orders"), rx.el.span(FlowState.stats, class_name="lg"), class_name="hd"),
        rx.el.div(
            rx.foreach(
                FlowState.filters,
                lambda f: rx.el.button(
                    f,
                    on_click=FlowState.pick_filter(f),
                    class_name=rx.cond(FlowState.status_filter == f, "chip on", "chip"),
                ),
            ),
            class_name="filters",
        ),
        rx.el.div(
            rx.el.table(
                rx.el.thead(rx.el.tr(*[rx.el.th(c) for c in ORDER_COLUMNS])),
                rx.el.tbody(rx.foreach(FlowState.rows, order_row)),
            ),
            class_name="scroll",
        ),
        class_name="box orders",
    )


def index() -> rx.Component:
    return rx.el.div(
        header(),
        rx.el.main(
            network_box(),
            rx.el.div(orders_box(), charts(), class_name="bottom"),
        ),
        class_name="fn",
        on_unmount=FlowState.stop,
    )


app = rx.App(stylesheets=["/flownet.css"])
app.add_page(index, title="FlowNet — Order Routing Topology", on_load=FlowState.run)
