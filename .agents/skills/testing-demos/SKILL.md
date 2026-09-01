---
name: testing-demos
description: How to run and test the webgl-plot demo pages in a browser
---

# Testing webgl-plot demos

- Start the dev server with `npm run test:html` (vite on port 5175, strict port). `npm install` must have run first.
- IMPORTANT: vite root is `demos/`, so demo URLs are `http://localhost:5175/<name>.html` (e.g. `/demo-plot.html`, `/index.html`) — NOT `/demos/<name>.html`. The `/demos/...` path silently falls back to serving index.html, which is confusing.
- WebGL2 rendering requires a GPU; use the headed browser on the box (repo's Playwright tests run headed for the same reason).
- If canvases render blank with NO console errors, check `canvas.getContext('webgl2')` — a Chrome launched without GL flags returns null and plots silently stay black. If Devin's managed browser (CDP port 29229) is down, relaunch it with software GL enabled, e.g.: `DISPLAY=:0 setsid /opt/.devin/chrome/chrome/linux-*/chrome-linux64/chrome --remote-debugging-port=29229 --no-first-run --no-default-browser-check --use-gl=angle --use-angle=gl --ignore-gpu-blocklist <url>` (llvmpipe renderer works fine).
- To exercise library APIs from the devtools console, `import('/src/...')` fails (outside vite root); use the `/@fs` prefix instead, e.g. `import('/@fs/home/ubuntu/repos/webgl-plot/src/webglplot.ts')`.
- Canvases render on a black page background; assert visuals via screenshots (curve colors follow the matplotlib cycle: blue first, orange second).
