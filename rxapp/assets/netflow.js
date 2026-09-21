// Network-flow topology canvas (clients -> BTS hub -> brokers) with animated
// routing particles. Port of the canvas code in ui7.html as a React component.
//
// props.events: [{id, kind, client, broker}] routing events emitted by the
//   server; every event with an id greater than the last one seen launches a
//   particle sequence. kind: order | fill | reject | cancel | chatter_in | chatter_out
// props.onStats({inflight, legIn, legOut}) is called once per second.
import { createElement, useEffect, useRef } from "react";

const N_CLIENTS = 9;
const CLIENT_IDS = Array.from({ length: N_CLIENTS }, (_, i) => "CL-" + (101 + i));
const BROKER_IDS = ["GSCO", "MSCO", "JPMS", "UBSW", "BARX"];
const COL = { order: "#60a5fa", fill: "#34d399", reject: "#fb7185", cancel: "#fbbf24" };

function curve(a, b, t) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 + (a.y === b.y ? 0 : a.y < b.y ? -1 : 1) * Math.abs(a.y - b.y) * 0.18;
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * mx + t * t * b.x, y: u * u * a.y + 2 * u * t * my + t * t * b.y };
}

function createNet() {
  const clients = CLIENT_IDS.map((id) => ({ id, glow: 0, x: 0, y: 0 }));
  const brokers = BROKER_IDS.map((id) => ({ id, glow: 0, x: 0, y: 0 }));
  const hub = { glow: 0, x: 0, y: 0 };
  const byId = new Map([...clients, ...brokers].map((n) => [n.id, n]));
  const net = { clients, brokers, hub, particles: [], legIn: 0, legOut: 0, layout: null };

  const send = (from, to, type, onArrive) => {
    net.particles.push({
      from, to, color: COL[type], t: 0,
      speed: 0.008 + Math.random() * 0.007,
      size: type === "order" ? 3 : 2.6,
      onArrive,
    });
  };

  net.launch = (ev) => {
    const cl = byId.get(ev.client);
    const bk = byId.get(ev.broker);
    switch (ev.kind) {
      case "order":
        if (!cl || !bk) return;
        cl.glow = 1;
        send(cl, hub, "order", () => {
          hub.glow = 1; net.legIn++;
          send(hub, bk, "order", () => { bk.glow = 1; net.legOut++; });
        });
        break;
      case "fill": case "reject": case "cancel":
        if (!cl || !bk) return;
        send(bk, hub, ev.kind, () => {
          hub.glow = 1; net.legOut++;
          send(hub, cl, ev.kind, () => { cl.glow = 1; net.legIn++; });
        });
        break;
      case "chatter_in":
        if (cl) send(hub, cl, "fill", () => { cl.glow = 0.6; net.legIn++; });
        break;
      case "chatter_out":
        if (bk) send(bk, hub, "order", () => { hub.glow = 0.6; net.legOut++; });
        break;
    }
  };

  net.computeLayout = (w, h) => {
    clients.forEach((c, i) => {
      const f = (i + 0.5) / clients.length;
      c.x = w * 0.09 + Math.sin(f * Math.PI) * w * 0.045;
      c.y = h * 0.12 + f * h * 0.76;
    });
    hub.x = w * 0.5; hub.y = h * 0.5;
    brokers.forEach((b, i) => {
      const f = (i + 0.5) / brokers.length;
      b.x = w * 0.91 - Math.sin(f * Math.PI) * w * 0.045;
      b.y = h * 0.16 + f * h * 0.68;
    });
    net.layout = { w, h };
  };

  net.draw = (cv) => {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (!net.layout || net.layout.w !== w || net.layout.h !== h) net.computeLayout(w, h);
    cv.width = w * dpr; cv.height = h * dpr;
    const nx = cv.getContext("2d");
    nx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nx.clearRect(0, 0, w, h);
    nx.lineWidth = 1;
    clients.forEach((c) => {
      nx.strokeStyle = "rgba(96,165,250,.10)";
      nx.beginPath(); nx.moveTo(c.x, c.y);
      const m = curve(c, hub, 0.5);
      nx.quadraticCurveTo(m.x * 2 - (c.x + hub.x) / 2, m.y * 2 - (c.y + hub.y) / 2, hub.x, hub.y); nx.stroke();
    });
    brokers.forEach((b) => {
      nx.strokeStyle = "rgba(167,139,250,.12)";
      nx.beginPath(); nx.moveTo(hub.x, hub.y);
      const m = curve(hub, b, 0.5);
      nx.quadraticCurveTo(m.x * 2 - (hub.x + b.x) / 2, m.y * 2 - (hub.y + b.y) / 2, b.x, b.y); nx.stroke();
    });
    nx.fillStyle = "#616d84"; nx.font = "700 11px monospace";
    nx.fillText("CLIENTS", clients[0].x - 24, Math.min(...clients.map((c) => c.y)) - 16);
    nx.fillText("BROKERS", brokers[0].x - 26, Math.min(...brokers.map((b) => b.y)) - 16);
    net.particles.forEach((p) => {
      p.t += p.speed;
      const pos = curve(p.from, p.to, Math.min(1, p.t));
      const tail = curve(p.from, p.to, Math.max(0, p.t - 0.06));
      nx.strokeStyle = p.color + "55"; nx.lineWidth = 2;
      nx.beginPath(); nx.moveTo(tail.x, tail.y); nx.lineTo(pos.x, pos.y); nx.stroke();
      nx.beginPath(); nx.arc(pos.x, pos.y, p.size, 0, 7);
      nx.fillStyle = p.color; nx.fill();
    });
    const arrived = net.particles.filter((p) => p.t >= 1);
    net.particles = net.particles.filter((p) => p.t < 1);
    arrived.forEach((p) => p.onArrive && p.onArrive());
    clients.forEach((c) => {
      if (c.glow > 0) c.glow = Math.max(0, c.glow - 0.03);
      if (c.glow) {
        nx.beginPath(); nx.arc(c.x, c.y, 10 + c.glow * 6, 0, 7);
        nx.fillStyle = `rgba(96,165,250,${c.glow * 0.25})`; nx.fill();
      }
      nx.beginPath(); nx.arc(c.x, c.y, 6, 0, 7);
      nx.fillStyle = "#12151d"; nx.fill(); nx.strokeStyle = "#60a5fa"; nx.lineWidth = 1.5; nx.stroke();
      nx.fillStyle = "#616d84"; nx.font = "9px monospace"; nx.fillText(c.id, c.x - 46, c.y + 3);
    });
    if (hub.glow > 0) hub.glow = Math.max(0, hub.glow - 0.025);
    const pulse = 8 + Math.sin(Date.now() / 300) * 2;
    nx.beginPath(); nx.arc(hub.x, hub.y, 26 + hub.glow * 10 + pulse * 0.3, 0, 7);
    nx.fillStyle = `rgba(34,211,238,${0.06 + hub.glow * 0.2})`; nx.fill();
    nx.beginPath(); nx.arc(hub.x, hub.y, 20, 0, 7);
    nx.fillStyle = "#0e1a20"; nx.fill(); nx.strokeStyle = "#22d3ee"; nx.lineWidth = 2; nx.stroke();
    nx.fillStyle = "#22d3ee"; nx.font = "700 12px monospace"; nx.fillText("BTS", hub.x - 11, hub.y + 4);
    nx.fillStyle = "#616d84"; nx.font = "9px monospace"; nx.fillText("routing hub", hub.x - 31, hub.y + 34);
    brokers.forEach((b) => {
      if (b.glow > 0) b.glow = Math.max(0, b.glow - 0.03);
      if (b.glow) {
        nx.beginPath(); nx.arc(b.x, b.y, 12 + b.glow * 6, 0, 7);
        nx.fillStyle = `rgba(167,139,250,${b.glow * 0.25})`; nx.fill();
      }
      nx.fillStyle = "#12151d"; nx.strokeStyle = "#a78bfa"; nx.lineWidth = 1.5;
      nx.beginPath(); nx.rect(b.x - 8, b.y - 8, 16, 16); nx.fill(); nx.stroke();
      nx.fillStyle = "#616d84"; nx.font = "9px monospace"; nx.fillText(b.id, b.x + 14, b.y + 3);
    });
  };
  return net;
}

export function NetFlow(props) {
  const canvasRef = useRef(null);
  const netRef = useRef(null);
  const lastIdRef = useRef(0);
  const onStatsRef = useRef(props.onStats);
  onStatsRef.current = props.onStats;

  useEffect(() => {
    const net = createNet();
    netRef.current = net;
    let raf = 0;
    const frame = () => {
      if (canvasRef.current) net.draw(canvasRef.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const timer = setInterval(() => {
      const cb = onStatsRef.current;
      if (cb) cb({ inflight: net.particles.length, legIn: net.legIn, legOut: net.legOut });
      net.legIn = 0; net.legOut = 0;
    }, 1000);
    return () => { cancelAnimationFrame(raf); clearInterval(timer); };
  }, []);

  useEffect(() => {
    const net = netRef.current;
    if (!net || !props.events) return;
    for (const ev of props.events) {
      if (ev.id > lastIdRef.current) {
        lastIdRef.current = ev.id;
        net.launch(ev);
      }
    }
  }, [props.events]);

  return createElement("canvas", {
    ref: canvasRef,
    style: { display: "block", width: "100%", height: "100%", ...props.style },
    className: props.className,
  });
}
