import { plot } from "../src/webglplot";

const xs: number[] = [];
const ys: number[] = [];
const ys2: number[] = [];
for (let i = 0; i <= 500; i++) {
  const x = -10 + (20 * i) / 500;
  xs.push(x);
  ys.push(Math.sin(x));
  ys2.push(Math.cos(x) * 0.5);
}

const figure = plot({
  type: "line",
  "x-range": [-10, 10],
  "y-range": [-1.2, 1.2],
  canvas: "lineCanvas",
  data: [
    { x: xs, y: ys, thickness: 3 },
    { x: xs, y: ys2, thickness: 3 },
  ],
});

const rangeButton = document.getElementById("toggleRange");
let zoomedOut = false;
rangeButton?.addEventListener("click", () => {
  zoomedOut = !zoomedOut;
  figure.update({ "x-range": zoomedOut ? [-20, 20] : [-10, 10] });
});

const sx: number[] = [];
const sy: number[] = [];
for (let i = 0; i < 300; i++) {
  const x = Math.random() * 20 - 10;
  sx.push(x);
  sy.push(x * 0.1 + (Math.random() - 0.5));
}

plot({
  type: "scatter",
  "x-range": [-10, 10],
  canvas: "scatterCanvas",
  data: { x: sx, y: sy },
});

// Each series picks its own type; ranges are shared across the figure.
const bx = Array.from({ length: 20 }, (_, i) => i);
const by = bx.map((i) => Math.sin(i / 3) * 0.6);
const segX: number[] = [];
const segY: number[] = [];
for (const i of bx) {
  for (let k = 0; k < 4; k++) {
    const y = by[i] + 0.3 + Math.random() * 0.5;
    segX.push(i - 0.4, i + 0.4);
    segY.push(y, y);
  }
}
plot({
  canvas: "mixedCanvas",
  "x-range": [-1, 20],
  "y-range": [-1, 1.6],
  data: [
    { type: "bar", x: bx, y: by, colors: by.map((v) => (v >= 0 ? [0.2, 0.83, 0.6, 0.7] : [0.98, 0.44, 0.52, 0.7])) },
    { type: "segments", x: segX, y: segY, color: [0.38, 0.65, 0.98, 0.6] },
    { type: "line", x: bx, y: by.map((v) => v + 0.55), color: [0.13, 0.83, 0.93, 0.8] },
    {
      type: "bubble",
      x: bx,
      y: by.map((v) => v + 0.55),
      sizes: bx.map((i) => 3 + (i % 5) * 3),
      color: [0.98, 0.75, 0.14, 0.8],
    },
  ],
});
