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

plot({
  type: "line",
  "x-range": [-10, 10],
  "y-range": [-1.2, 1.2],
  canvas: "lineCanvas",
  data: [
    { x: xs, y: ys, thickness: 3 },
    { x: xs, y: ys2, thickness: 3 },
  ],
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
