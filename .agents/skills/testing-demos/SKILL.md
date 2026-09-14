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

# Testing the Reflex integration (reflex-webgl-plot/)

- Sample app lives at `~/reflex-test-app` (`reflex_test_app/reflex_test_app.py` uses `webgl_plot_figure(config=State.config)` with a toggle button). Start with `PATH=~/.local/share/reflex/bun/bin:$PATH reflex run` from that dir; frontend http://localhost:3000/, backend :8000.
- The Reflex component's `library` points at the prebuilt GitHub `release` branch (`@openmarketdata/webgl-plot/react@github:openmarketdata/webgl-plot#release`), which a GitHub Actions workflow publishes with `dist/` and a scripts/devDependencies-stripped package.json. Reflex installs frontend deps with **bun**, which does NOT run git dependencies' `prepare` scripts — so never point `library` at a source branch (that yields a checkout without `dist/` and a vite overlay "Failed to resolve import @openmarketdata/webgl-plot/react"; Reflex hides the bun install output via `suppress_errors=True`).
  - After changing the `library` spec: `pip install --user ./reflex-webgl-plot` again AND `rm -rf ~/reflex-test-app/.web` so Reflex regenerates `.web/package.json` (bun.lock pins the old ref otherwise). Verify with `grep openmarketdata .web/package.json` and `ls .web/node_modules/@openmarketdata/webgl-plot/dist/react.*`.
  - If the release branch is stale relative to source, re-run the release workflow rather than copying an npm-built package into `.web/node_modules` (bun re-links on every start, and that hides the real install state). Vite caches a failed resolution — if the overlay already appeared, restart `reflex run`.
- If clicking a button does nothing and the console says `no dispatch function for substate "...reflex_test_app____state"`, the granian dev backend loaded the app by file path (unqualified `__module__`) while the frontend was compiled with the qualified module name. Fix: `pip install --user uvicorn gunicorn` so Reflex falls back to uvicorn with a module target (names then match). Do not run `reflex run --backend-only` + a manual frontend; that has the same mismatch.
- WebGL2 in the managed Chrome works via SwiftShader/ANGLE for the Reflex page too; a 800x400 canvas with a blue line for x=[1,2,3] is the expected render.
