import { useRef as G, useEffect as $, createElement as st } from "react";
class f {
  static debugEnabled = !1;
  /**
   * Set debug mode globally
   */
  static setDebugMode(t) {
    f.debugEnabled = t;
  }
  /**
   * Get current debug mode status
   */
  static isDebugEnabled() {
    return f.debugEnabled;
  }
  /**
   * Debug log - only shows when debug mode is enabled
   */
  static log(t) {
    f.debugEnabled && console.log(`[webglplot] ${t}`);
  }
  /**
   * Debug warn - only shows when debug mode is enabled
   */
  static warn(t) {
    f.debugEnabled && console.warn(`[webglplot] ${t}`);
  }
  /**
   * Error logging - always shows (not affected by debug flag)
   */
  static error(t) {
    console.error(`[webglplot] ${t}`);
  }
}
const z = 1e-9;
function X(a, t, e) {
  if (!t && !e) {
    const s = a.length / 2;
    return { isValid: !0, validPointCount: s, totalPoints: s, validRatio: 1 };
  }
  let i = 0;
  const o = a.length / 2;
  for (let s = 0; s < a.length; s += 2) {
    const l = a[s], h = a[s + 1], d = !t || l > 0, m = !e || h > 0;
    d && m && i++;
  }
  const r = i / o;
  return { isValid: i >= 2 && r >= 0.1, validPointCount: i, totalPoints: o, validRatio: r };
}
function Q(a, t, e) {
  let i = 1 / 0, o = -1 / 0, r = 1 / 0, n = -1 / 0, s = !1;
  for (let l = 0; l < a.length; l += 2) {
    let h = a[l], d = a[l + 1];
    t && h <= 0 || e && d <= 0 || (t && h > 0 && (h = Math.log10(h)), e && d > 0 && (d = Math.log10(d)), s = !0, h < i && (i = h), h > o && (o = h), d < r && (r = d), d > n && (n = d));
  }
  return !s || !isFinite(i) || !isFinite(o) || !isFinite(r) || !isFinite(n) ? null : {
    minX: i,
    maxX: o,
    minY: r,
    maxY: n,
    coordinateSpace: {
      x: t ? "log" : "linear",
      y: e ? "log" : "linear"
    }
  };
}
function U(a) {
  const { minX: t, maxX: e, minY: i, maxY: o } = a, r = e - t, n = o - i, s = 2, l = 2;
  let h = 1, d = 1, m = 0, A = 0;
  return r > z ? (h = s / r, m = 0 - (t + r / 2) * h) : (h = 1, m = 0 - t * h), n > z ? (d = l / n, A = 0 - (i + n / 2) * d) : (d = 1, A = 0 - i * d), [h, d, m, A];
}
function tt(a, t, e) {
  const { minX: i, maxX: o, minY: r, maxY: n } = a;
  return t && (i <= 0 || o <= 0) ? (f.log("transformBoundsToLogSpace: Cannot transform X bounds - contains non-positive values"), null) : e && (r <= 0 || n <= 0) ? (f.log("transformBoundsToLogSpace: Cannot transform Y bounds - contains non-positive values"), null) : {
    minX: t ? Math.log10(i) : i,
    maxX: t ? Math.log10(o) : o,
    minY: e ? Math.log10(r) : r,
    maxY: e ? Math.log10(n) : n,
    coordinateSpace: {
      x: t ? "log" : a.coordinateSpace.x,
      y: e ? "log" : a.coordinateSpace.y
    }
  };
}
function k(a, t, e) {
  const { minX: i, maxX: o, minY: r, maxY: n } = a;
  return {
    minX: t ? Math.pow(10, i) : i,
    maxX: t ? Math.pow(10, o) : o,
    minY: e ? Math.pow(10, r) : r,
    maxY: e ? Math.pow(10, n) : n,
    coordinateSpace: {
      x: t ? "linear" : a.coordinateSpace.x,
      y: e ? "linear" : a.coordinateSpace.y
    }
  };
}
function C(a, t, e, i) {
  const [o, r] = a, [n, s] = t, l = (-1 - n) / o, h = (1 - n) / o, d = (-1 - s) / r, m = (1 - s) / r;
  return {
    minX: l,
    maxX: h,
    minY: d,
    maxY: m,
    coordinateSpace: {
      x: e ? "log" : "linear",
      y: i ? "log" : "linear"
    }
  };
}
class R {
  gl;
  maxLines;
  linesConfig = [];
  numLines = 0;
  vertexBuffer = null;
  colorBuffer = null;
  // Or UBO for colors later
  prog = null;
  lineStarts = [];
  // To store the starting index of each line's vertices
  lineLengths = [];
  // To store the number of vertices for each line
  globalScale = [1, 1];
  globalOffset = [0, 0];
  locations = {};
  // Log axis flags
  logX = !1;
  logY = !1;
  constructor(t, e) {
    if (this.gl = t, this.maxLines = e, this.linesConfig = [], this.numLines = 0, this.vertexBuffer = null, this.colorBuffer = null, this.lineStarts = [], this.lineLengths = [], this.globalScale = [1, 1], this.globalOffset = [0, 0], this.prog = this._createShaderProgram(), !this.prog) {
      f.error("Failed to create shader program.");
      return;
    }
    this.locations = {
      a_position: t.getAttribLocation(this.prog, "a_position"),
      a_color: t.getAttribLocation(this.prog, "a_color"),
      u_line_scale: t.getUniformLocation(this.prog, "u_line_scale"),
      u_line_offset: t.getUniformLocation(this.prog, "u_line_offset"),
      u_global_scale: t.getUniformLocation(this.prog, "u_global_scale"),
      u_global_offset: t.getUniformLocation(this.prog, "u_global_offset"),
      u_opacity: t.getUniformLocation(this.prog, "u_opacity"),
      u_log_axis: t.getUniformLocation(this.prog, "u_log_axis")
    }, t.enable(t.BLEND), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA);
  }
  _createShaderProgram() {
    const t = this.gl, e = `#version 300 es
      layout(location = 0) in vec2 a_position; // Assuming location 0 for position
      layout(location = 1) in vec3 a_color;    // Assuming location 1 for color

      uniform vec2 u_line_scale;
      uniform vec2 u_line_offset;
      uniform vec2 u_global_scale;
      uniform vec2 u_global_offset;
      uniform vec2 u_log_axis; // x: logX enabled (1.0/0.0), y: logY enabled (1.0/0.0)

      out vec3 v_color;

      void main() {
        vec2 pos = a_position;
        
        // Apply logarithmic transformation if enabled
        if (u_log_axis.x > 0.5) {
          if (pos.x > 0.0) {
            pos.x = log(pos.x) / log(10.0); // log10
          } else {
            pos.x = -1000.0; // Move negative/zero values far off-screen
          }
        }
        if (u_log_axis.y > 0.5) {
          if (pos.y > 0.0) {
            pos.y = log(pos.y) / log(10.0); // log10
          } else {
            pos.y = -1000.0; // Move negative/zero values far off-screen
          }
        }
        
        gl_Position = vec4((pos * u_line_scale + u_line_offset) * u_global_scale + u_global_offset, 0.0, 1.0);
        v_color = a_color;
      }
    `, i = `#version 300 es
      precision mediump float;
      in vec3 v_color;
      uniform float u_opacity;
      out vec4 outColor;

      void main() {
        outColor = vec4(v_color, u_opacity);
      }
    `, o = t.createShader(t.VERTEX_SHADER);
    if (!o)
      return f.error("Unable to create vertex shader"), null;
    if (t.shaderSource(o, e), t.compileShader(o), !t.getShaderParameter(o, t.COMPILE_STATUS))
      return f.error(
        `Error compiling vertex shader: ${t.getShaderInfoLog(o) || "Unknown error"}`
      ), t.deleteShader(o), null;
    const r = t.createShader(t.FRAGMENT_SHADER);
    if (!r)
      return f.error("Unable to create fragment shader"), t.deleteShader(o), null;
    if (t.shaderSource(r, i), t.compileShader(r), !t.getShaderParameter(r, t.COMPILE_STATUS))
      return f.error(
        `Error compiling fragment shader: ${t.getShaderInfoLog(r) || "Unknown error"}`
      ), t.deleteShader(o), t.deleteShader(r), null;
    const n = t.createProgram();
    return n ? (t.attachShader(n, o), t.attachShader(n, r), t.linkProgram(n), t.getProgramParameter(n, t.LINK_STATUS) ? (t.detachShader(n, o), t.detachShader(n, r), t.deleteShader(o), t.deleteShader(r), n) : (f.error(
      `Error linking shader program: ${t.getProgramInfoLog(n) || "Unknown error"}`
    ), t.deleteProgram(n), t.deleteShader(o), t.deleteShader(r), null)) : (f.error("Unable to create shader program"), t.deleteShader(o), t.deleteShader(r), null);
  }
  initLines(t) {
    const e = this.gl;
    if (t.length > this.maxLines ? (f.warn(
      `Number of lines (${t.length}) exceeds maxLines (${this.maxLines}). Slicing.`
    ), this.linesConfig = t.slice(0, this.maxLines).map((l) => ({ ...l }))) : this.linesConfig = t.map((l) => ({ ...l })), this.numLines = this.linesConfig.length, this.lineStarts = [], this.lineLengths = [], this.vertexBuffer && (e.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.colorBuffer && (e.deleteBuffer(this.colorBuffer), this.colorBuffer = null), this.numLines === 0)
      return;
    let i = 0;
    for (const l of this.linesConfig) {
      l.scale = l.scale || [1, 1], l.offset = l.offset || [0, 0], l.enabled === void 0 && (l.enabled = !0), l.thickness === void 0 && (l.thickness = 1);
      const h = l.points.length / 2;
      this.lineStarts.push(i), this.lineLengths.push(h), i += h;
    }
    const o = new Float32Array(i * 2), r = new Float32Array(i * 3);
    let n = 0, s = 0;
    for (let l = 0; l < this.numLines; l++) {
      const h = this.linesConfig[l];
      o.set(h.points, n);
      for (let d = 0; d < this.lineLengths[l]; d++)
        r[s++] = h.color[0], r[s++] = h.color[1], r[s++] = h.color[2];
      n += h.points.length;
    }
    this.vertexBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, o, e.STATIC_DRAW), this.colorBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, this.colorBuffer), e.bufferData(e.ARRAY_BUFFER, r, e.STATIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null), this.prog && this.locations.u_global_scale && this.locations.u_global_offset && (e.useProgram(this.prog), e.uniform2f(
      this.locations.u_global_scale,
      this.globalScale[0],
      this.globalScale[1]
    ), e.uniform2f(
      this.locations.u_global_offset,
      this.globalOffset[0],
      this.globalOffset[1]
    ), e.useProgram(null));
  }
  cleanup() {
    const t = this.gl;
    this.prog && (t.deleteProgram(this.prog), this.prog = null), this.vertexBuffer && (t.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.colorBuffer && (t.deleteBuffer(this.colorBuffer), this.colorBuffer = null), this.linesConfig = [], this.numLines = 0, this.lineStarts = [], this.lineLengths = [];
  }
  updateLinePoints(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for updateLinePoints`);
      return;
    }
    if (!this.vertexBuffer) {
      f.warn("Vertex buffer not initialized for updateLinePoints");
      return;
    }
    const i = this.linesConfig[t], o = this.lineLengths[t];
    if (e.length / 2 !== o) {
      f.warn(
        `Number of points in provided data (${e.length / 2}) does not match existing points in line ${t} (${o}). Cannot change number of points with this method.`
      );
      return;
    }
    i.points = e;
    const n = this.lineStarts[t] * 2 * Float32Array.BYTES_PER_ELEMENT, s = this.gl;
    s.bindBuffer(s.ARRAY_BUFFER, this.vertexBuffer), s.bufferSubData(s.ARRAY_BUFFER, n, e), s.bindBuffer(s.ARRAY_BUFFER, null);
  }
  updateLineY(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for updateLineY`);
      return;
    }
    if (!this.vertexBuffer) {
      f.warn("Vertex buffer not initialized for updateLineY");
      return;
    }
    const i = this.linesConfig[t], o = this.lineLengths[t];
    if (e.length !== o) {
      f.warn(
        `Length of newY array (${e.length}) does not match number of points in line ${t} (${o}).`
      );
      return;
    }
    for (let l = 0; l < o; l++)
      i.points[l * 2 + 1] = e[l];
    const n = this.lineStarts[t] * 2 * Float32Array.BYTES_PER_ELEMENT, s = this.gl;
    s.bindBuffer(s.ARRAY_BUFFER, this.vertexBuffer), s.bufferSubData(s.ARRAY_BUFFER, n, i.points), s.bindBuffer(s.ARRAY_BUFFER, null);
  }
  updateLineColor(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for updateLineColor`);
      return;
    }
    if (!this.colorBuffer) {
      f.warn("Color buffer not initialized for updateLineColor");
      return;
    }
    this.linesConfig[t].color = e;
    const i = this.lineStarts[t], o = this.lineLengths[t], r = new Float32Array(o * 3);
    let n = 0;
    for (let l = 0; l < o; l++)
      r[n++] = e[0], r[n++] = e[1], r[n++] = e[2];
    const s = this.gl;
    s.bindBuffer(s.ARRAY_BUFFER, this.colorBuffer), s.bufferSubData(
      s.ARRAY_BUFFER,
      i * 3 * Float32Array.BYTES_PER_ELEMENT,
      r
    ), s.bindBuffer(s.ARRAY_BUFFER, null);
  }
  updateLineTransform(t, e, i) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for updateLineTransform`);
      return;
    }
    this.linesConfig[t].scale = e, this.linesConfig[t].offset = i;
  }
  /**
   * Update the thickness for a specific line.
   * @param lineId ID of the line to update
   * @param thickness New thickness value for the line
   */
  updateLineThickness(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for updateLineThickness`);
      return;
    }
    this.linesConfig[t].thickness = e;
  }
  /**
   * Enable or disable rendering for a specific line.
   * @param lineId ID of the line to enable/disable
   * @param enabled True to enable rendering, false to disable
   */
  setLineEnabled(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for setLineEnabled`);
      return;
    }
    this.linesConfig[t].enabled = e;
  }
  /**
   * Enable or disable rendering for multiple lines at once.
   * @param lineIds Array of line IDs to enable/disable
   * @param enabled True to enable rendering, false to disable
   */
  setMultipleLinesEnabled(t, e) {
    for (const i of t)
      i >= 0 && i < this.numLines ? this.linesConfig[i].enabled = e : f.warn(`Invalid lineId ${i} in setMultipleLinesEnabled`);
  }
  /**
   * Update transform parameters for multiple lines at once.
   * @param lineIds Array of line IDs to update
   * @param scale Scale factors [scaleX, scaleY]
   * @param offset Offset values [offsetX, offsetY]
   */
  updateMultipleLinesTransform(t, e, i) {
    for (const o of t)
      o >= 0 && o < this.numLines ? (this.linesConfig[o].scale = [e[0], e[1]], this.linesConfig[o].offset = [i[0], i[1]]) : f.warn(`Invalid lineId ${o} in updateMultipleLinesTransform`);
  }
  /**
   * Set the global transformation matrix for the plot.
   * @param scale Global scale factors [scaleX, scaleY] 
   * @param offset Global offset values [offsetX, offsetY]
   */
  setGlobalTransform(t, e) {
    this.globalScale = t, this.globalOffset = e, this.prog && this.locations.u_global_scale && this.locations.u_global_offset && (this.gl.useProgram(this.prog), this.gl.uniform2f(
      this.locations.u_global_scale,
      this.globalScale[0],
      this.globalScale[1]
    ), this.gl.uniform2f(
      this.locations.u_global_offset,
      this.globalOffset[0],
      this.globalOffset[1]
    ), this.gl.useProgram(null));
  }
  /**
   * Enable or disable logarithmic scaling for X and/or Y axes.
   * 
   * When enabled, coordinates are transformed using log₁₀ on the GPU in real-time.
   * Negative and zero values are automatically filtered out (moved off-screen).
   * 
   * **Important Notes:**
   * - Transformation happens on GPU for optimal performance
   * - No graph reinitialization required - changes apply immediately
   * - Auto-scaling will automatically account for log transformation
   * 
   * **Example Usage:**
   * ```typescript
   * // Enable log Y-axis for exponential data
   * thinPlotter.setLogAxis(false, true);
   * 
   * // Enable both axes for power-law data
   * thinPlotter.setLogAxis(true, true);
   * 
   * // Disable all log scaling
   * thinPlotter.setLogAxis(false, false);
   * ```
   * 
   * @param x Enable logarithmic base-10 scaling for X-axis
   * @param y Enable logarithmic base-10 scaling for Y-axis
   */
  setLogAxis(t, e) {
    this.logX = t, this.logY = e;
  }
  /**
   * Auto-scale the plotter to fit log-transformed data, using either actual data bounds
   * or converting existing transform-based viewport bounds to log space.
   * 
   * This function intelligently handles the transition from linear to log space by
   * using actual data bounds when provided, or falling back to transforming the 
   * current viewport bounds from linear to log space.
   * 
   * **Use Cases:**
   * - After toggling log axes to maintain current view
   * - For smooth transitions between linear and log representations  
   * - When you want to preserve user's current zoom/pan state
   * - For accurate scaling based on actual data bounds
   * 
   * **Example Usage:**
   * ```typescript
   * // Preserve current coordinate space (recommended for maintaining zoom/pan)
   * const bounds = thinPlotter.getDataBounds();
   * thinPlotter.transformToLogSpace(bounds);
   * 
   * // Alternative: same result, preserves current coordinate space
   * thinPlotter.transformToLogSpace();
   * ```
   * 
   * @param dataBounds Optional actual data bounds {minX, maxX, minY, maxY}. 
   *                   If provided, uses actual data bounds instead of transform-based bounds.
   * @returns True if smart scaling was applied, false if transformation not feasible
   */
  transformToLogSpace(t) {
    if (!this.logX && !this.logY)
      return f.log("transformToLogSpace: No log axes enabled, no scaling needed"), !0;
    let e;
    t ? (e = t, f.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), f.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (this.logX && e.coordinateSpace.x === "log" || this.logY && e.coordinateSpace.y === "log") && (f.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = k(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), f.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));
    const o = tt(i, this.logX, this.logY);
    if (!o)
      return f.log("transformToLogSpace: Cannot transform bounds to log space"), !1;
    const [r, n, s, l] = U(o);
    return this.setGlobalTransform([r, n], [s, l]), f.log(`transformToLogSpace: Applied new transform - Scale[${r.toFixed(4)}, ${n.toFixed(4)}], Offset[${s.toFixed(4)}, ${l.toFixed(4)}]`), !0;
  }
  /**
   * Transform data bounds to linear space and apply appropriate scaling.
   *
   * **ENHANCED**: This method automatically handles coordinate space conversion.
   * It detects the coordinate space of input bounds and converts as needed.
   *
   * **Typical usage patterns:**
   * - **Switching to linear axes**: `getDataBounds()` → `transformToLinearSpace()` (preserves view)
   * - **Zoom/pan in linear space**: `getDataBounds()` → `transformToLinearSpace()`
   * - **Initial linear setup**: `getAllDataBounds()` → `transformToLinearSpace()`
   *
   * @param dataBounds Optional data bounds with coordinate space information.
   *                   If not provided, will attempt to get bounds from current transform.
   * @returns True if linear space transformation was applied successfully,
   *          false if transformation not feasible
   *
   * @example
   * ```typescript
   * // Switching from log to linear axes while preserving view
   * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
   * plotter.setLogAxis(false, false); // Switch to linear axes
   * const success = plotter.transformToLinearSpace(bounds); // Preserves current view
   * 
   * // Works seamlessly from any coordinate mode
   * const currentBounds = plotter.getDataBounds(); 
   * plotter.transformToLinearSpace(currentBounds); // Always handles conversion correctly!
   * ```
   */
  transformToLinearSpace(t) {
    let e;
    t ? (e = t, f.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), f.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (e.coordinateSpace.x === "log" || e.coordinateSpace.y === "log") && (f.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = k(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), f.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)), i.coordinateSpace = {
      x: "linear",
      y: "linear"
    };
    const [o, r, n, s] = U(i);
    return this.setGlobalTransform([o, r], [n, s]), f.log(`transformToLinearSpace: Applied linear transform - Scale[${o.toFixed(4)}, ${r.toFixed(4)}], Offset[${n.toFixed(4)}, ${s.toFixed(4)}]`), !0;
  }
  /**
   * Get the data bounds of all enabled lines (for autoscaling purposes).
   * This returns the complete extent of all data and should be used with autoScale().
   * For preserving current coordinate space, use getDataBounds() instead.
   * @returns Object with minX, maxX, minY, maxY of all the data, or null if no valid data
   */
  getAllDataBounds() {
    if (this.numLines === 0)
      return null;
    let t = 1 / 0, e = -1 / 0, i = 1 / 0, o = -1 / 0, r = !1;
    for (let n = 0; n < this.numLines; n++) {
      const s = this.linesConfig[n];
      if (!s.enabled || s.points.length === 0)
        continue;
      const l = s.points, h = X(l, this.logX, this.logY);
      if (!h.isValid) {
        f.log(`getAllDataBounds: Skipping line ${n} - only ${h.validPointCount}/${h.totalPoints} (${(h.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }
      r = !0;
      const d = Q(l, this.logX, this.logY);
      d && (d.minX < t && (t = d.minX), d.maxX > e && (e = d.maxX), d.minY < i && (i = d.minY), d.maxY > o && (o = d.maxY));
    }
    return !r || !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(o) ? null : {
      minX: t,
      maxX: e,
      minY: i,
      maxY: o,
      coordinateSpace: {
        x: this.logX ? "log" : "linear",
        y: this.logY ? "log" : "linear"
      }
    };
  }
  /**
   * Get the data bounds of the current coordinate space (viewport).
   * This preserves the current zoom/pan when transforming to log space.
   * Use this with transformToLogSpace() to maintain user's coordinate space.
   * @returns Object with minX, maxX, minY, maxY of the current view with coordinate space information, or null if invalid transform
   */
  getDataBounds() {
    return C(this.globalScale, this.globalOffset, this.logX, this.logY);
  }
  /**
   * Auto-scale to fit all enabled lines in the current coordinate space.
   *
   * **IMPORTANT**: This method operates within the current coordinate space (linear or log)
   * and does NOT change coordinate spaces. It calculates bounds appropriate for the current
   * axis configuration and applies the transform.
   *
   * **Use autoScale() when:**
   * - Want to fit all data in the current coordinate space
   * - Need simple auto-scaling without changing coordinate spaces
   * - Don't need to preserve current zoom/pan state
   *
   * **⚠️ WARNING: Do NOT combine autoScale() with coordinate transforms!**
   * - autoScale() already works in the current coordinate space
   * - Calling transformToLogSpace() after autoScale() causes double-conversion
   *
   * **For coordinate space changes, use:**
   * - `transformToLogSpace()` - Switch to or operate in log space
   * - `transformToLinearSpace()` - Switch to or operate in linear space
   *
   * @returns DataBounds object with calculated bounds in current coordinate space, or null if no valid data
   *
   * @example
   * ```typescript
   * // ✅ CORRECT: Simple auto-scaling in current coordinate space
   * plotter.setLogAxis(false, true); // Enable log Y
   * plotter.autoScale(); // Auto-scales in log Y space - NO conversion needed!
   * 
   * // ❌ WRONG: Don't combine autoScale() with coordinate transforms
   * // const bounds = plotter.autoScale();
   * // plotter.transformToLogSpace(bounds); // This causes double-conversion!
   * 
   * // ✅ CORRECT: For coordinate space conversion, use getAllDataBounds():
   * // plotter.setLogAxis(false, true); // Enable log Y
   * // const bounds = plotter.getAllDataBounds(); // Gets linear data bounds
   * // if (bounds) plotter.transformToLogSpace(bounds); // Converts to log space
   * ```
   */
  autoScale() {
    if (this.numLines === 0)
      return f.warn("No lines to auto-scale."), null;
    let t = 1 / 0, e = -1 / 0, i = 1 / 0, o = -1 / 0, r = !1;
    for (let m = 0; m < this.numLines; m++) {
      const A = this.linesConfig[m], x = A.scale, u = A.offset;
      if (!A.enabled || A.points.length === 0)
        continue;
      const c = A.points, y = X(c, this.logX, this.logY);
      if (!y.isValid) {
        f.log(`autoScale: Skipping line ${m} - only ${y.validPointCount}/${y.totalPoints} (${(y.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }
      r = !0;
      for (let g = 0; g < c.length; g += 2) {
        let p = c[g], b = c[g + 1];
        if (this.logX)
          if (p > 0)
            p = Math.log10(p);
          else
            continue;
        if (this.logY)
          if (b > 0)
            b = Math.log10(b);
          else
            continue;
        p = p * x[0] + u[0], b = b * x[1] + u[1], p < t && (t = p), p > e && (e = p), b < i && (i = b), b > o && (o = b);
      }
    }
    if (!r || !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(o))
      return f.warn(
        "No data available for scaling or bounds are invalid. Resetting global transform."
      ), this.setGlobalTransform([1, 1], [0, 0]), null;
    const n = {
      minX: t,
      maxX: e,
      minY: i,
      maxY: o,
      coordinateSpace: {
        x: this.logX ? "log" : "linear",
        y: this.logY ? "log" : "linear"
      }
    }, [s, l, h, d] = U(n);
    return f.log(
      `AutoScale Results: Bounds [${t.toFixed(3)}, ${e.toFixed(
        3
      )}], [${i.toFixed(3)}, ${o.toFixed(
        3
      )}] -> Global Scale: [${s.toFixed(4)}, ${l.toFixed(
        4
      )}], Offset: [${h.toFixed(4)}, ${d.toFixed(4)}]`
    ), this.setGlobalTransform([s, l], [h, d]), n;
  }
  draw = () => {
    if (!this.prog || !this.vertexBuffer || !this.colorBuffer || this.numLines === 0 || !this.locations || this.locations.a_position === void 0 || // Ensure locations are actually numbers
    this.locations.a_color === void 0 || !this.locations.u_global_scale || !this.locations.u_global_offset || !this.locations.u_line_scale || !this.locations.u_line_offset || !this.locations.u_opacity || !this.locations.u_log_axis)
      return;
    const t = this.gl;
    t.useProgram(this.prog), t.uniform2f(
      this.locations.u_global_scale,
      this.globalScale[0],
      this.globalScale[1]
    ), t.uniform2f(
      this.locations.u_global_offset,
      this.globalOffset[0],
      this.globalOffset[1]
    ), t.uniform2f(
      this.locations.u_log_axis,
      this.logX ? 1 : 0,
      this.logY ? 1 : 0
    ), t.bindBuffer(t.ARRAY_BUFFER, this.vertexBuffer), t.vertexAttribPointer(this.locations.a_position, 2, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(this.locations.a_position), t.bindBuffer(t.ARRAY_BUFFER, this.colorBuffer), t.vertexAttribPointer(this.locations.a_color, 3, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(this.locations.a_color);
    for (let e = 0; e < this.numLines; e++) {
      const i = this.linesConfig[e];
      i.enabled && (t.uniform2f(this.locations.u_line_scale, i.scale[0], i.scale[1]), t.uniform2f(
        this.locations.u_line_offset,
        i.offset[0],
        i.offset[1]
      ), t.uniform1f(this.locations.u_opacity, i.color[3]), t.lineWidth(i.thickness), t.drawArrays(t.LINE_STRIP, this.lineStarts[e], this.lineLengths[e]));
    }
    t.disableVertexAttribArray(this.locations.a_position), t.disableVertexAttribArray(this.locations.a_color), t.bindBuffer(t.ARRAY_BUFFER, null), t.useProgram(null);
  };
  /**
   * Gets the configuration for a specific line.
   * @param lineId The ID of the line.
   * @returns The LineConfig object or undefined if not found.
   */
  getLineConfig(t) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for getLineConfig`);
      return;
    }
    return this.linesConfig[t];
  }
  /**
   * Get the current global transform scale values.
   * @returns [scaleX, scaleY] array
   */
  getGlobalScale() {
    return [this.globalScale[0], this.globalScale[1]];
  }
  /**
   * Get the current global transform offset values.
   * @returns [offsetX, offsetY] array
   */
  getGlobalOffset() {
    return [this.globalOffset[0], this.globalOffset[1]];
  }
}
const at = (a) => `#version 300 es
precision highp float;
precision highp int;
#define MAX_LINES ${a}

// --- Uniforms ---
uniform sampler2D uPointsTex;
uniform int uTexWidth;
uniform int uTexHeight;
uniform vec2 uGlobalScale;  // Global Scale
uniform vec2 uGlobalOffset; // Global Offset
uniform vec2 uViewportSize;
uniform vec2 uLogAxis;      // x: logX enabled (1.0/0.0), y: logY enabled (1.0/0.0)

// --- UBO ---
struct LineData {
  vec4 transform; // scale.x, scale.y, offset.x, offset.y
  vec4 color;     // r, g, b, a
  ivec4 indices;  // start index, number of points (0=disabled), unused, unused
  float thickness;
};
layout(std140) uniform LineDataBlock {
  LineData uLines[MAX_LINES];
};

// --- Attributes ---
in float aLineId;
in float aIndex;
in float aIsBevel;
in vec2 aBevelNormal;
in float aSide;

// --- Outputs ---
flat out vec4 vColor;

// --- Helper: Get Point ---
vec2 getPoint(int globalPointIndex) {
  int texX = globalPointIndex % uTexWidth;
  int texY = globalPointIndex / uTexWidth;
  float u = (float(texX) + 0.5) / float(uTexWidth);
  float v = (float(texY) + 0.5) / float(uTexHeight);
  return texture(uPointsTex, vec2(u, v)).xy;
}

// --- Helpers: screen/clip conversions and normals ---
vec2 clipToPixel(vec2 deltaClip) {
  // clip coordinates are -1..1; converting a delta to pixel space needs half viewport scale
  return deltaClip * vec2(0.5 * uViewportSize.x, 0.5 * uViewportSize.y);
}

vec2 pixelToClip(vec2 deltaPixels) {
  return deltaPixels * vec2(2.0 / uViewportSize.x, 2.0 / uViewportSize.y);
}

vec2 screenNormalFromDir(vec2 dirClip) {
  // Convert direction to pixel space before computing a perpendicular so aspect ratio and zoom are respected
  vec2 dirPixels = clipToPixel(dirClip);
  float len = length(dirPixels);
  if (len < 0.0001) {
    return vec2(0.0, 0.0);
  }
  return vec2(-dirPixels.y, dirPixels.x) / len;
}

vec2 thicknessOffsetFromNormal(vec2 normalPixels, float desiredHalfPixelThickness, float side) {
  if (desiredHalfPixelThickness < 0.0001 || length(normalPixels) < 0.0001 || uViewportSize.x < 0.001 || uViewportSize.y < 0.001) {
    return vec2(0.0, 0.0);
  }
  return pixelToClip(normalPixels * (desiredHalfPixelThickness * side));
}

// --- Main ---
void main() {
  int lineId = int(aLineId);
  int localIndex = int(aIndex); // This is the original point index passed from CPU

  // Access UBO for line properties
  int globalStartIndex = uLines[lineId].indices.x;
  int numPoints = uLines[lineId].indices.y; // Total points in the current line segment

  vColor = uLines[lineId].color; // Assign color to fragment shader

  // Early exit for disabled lines
  if (numPoints <= 0) {
     gl_Position = vec4(-2.0, -2.0, 0.0, 1.0); // Move off-screen
     return;
  }

  // Common variables needed for both paths
  vec2 lineScale = uLines[lineId].transform.xy;
  vec2 lineOffset = uLines[lineId].transform.zw;
  float desiredHalfPixelThickness = uLines[lineId].thickness * 0.5;

  // Retrieve the current point's original coordinates from texture
  // Note: aIndex (localIndex) directly maps to the point's position in the line's own array
  vec2 p_original = getPoint(globalStartIndex + localIndex);
  
  // Apply logarithmic transformation if enabled
  vec2 p_log = p_original;
  if (uLogAxis.x > 0.5) {
    if (p_log.x > 0.0) {
      p_log.x = log(p_log.x) / log(10.0); // log10
    } else {
      p_log.x = -1000.0; // Move negative/zero values far off-screen
    }
  }
  if (uLogAxis.y > 0.5) {
    if (p_log.y > 0.0) {
      p_log.y = log(p_log.y) / log(10.0); // log10
    } else {
      p_log.y = -1000.0; // Move negative/zero values far off-screen
    }
  }
  
  vec2 p_transformed = p_log * lineScale + lineOffset; // Apply per-line transform after log
  vec2 p_globally_transformed = p_transformed * uGlobalScale + uGlobalOffset;

  // Precompute neighbor points (with log + transforms) for consistent normal calculation
  vec2 pPrev_original = (localIndex == 0) ? p_original : getPoint(globalStartIndex + max(0, localIndex - 1));
  vec2 pNext_original = (localIndex == numPoints - 1) ? p_original : getPoint(globalStartIndex + min(numPoints - 1, localIndex + 1));

  vec2 pPrev_log = pPrev_original;
  if (uLogAxis.x > 0.5) {
    if (pPrev_log.x > 0.0) {
      pPrev_log.x = log(pPrev_log.x) / log(10.0);
    } else {
      pPrev_log.x = -1000.0;
    }
  }
  if (uLogAxis.y > 0.5) {
    if (pPrev_log.y > 0.0) {
      pPrev_log.y = log(pPrev_log.y) / log(10.0);
    } else {
      pPrev_log.y = -1000.0;
    }
  }

  vec2 pNext_log = pNext_original;
  if (uLogAxis.x > 0.5) {
    if (pNext_log.x > 0.0) {
      pNext_log.x = log(pNext_log.x) / log(10.0);
    } else {
      pNext_log.x = -1000.0;
    }
  }
  if (uLogAxis.y > 0.5) {
    if (pNext_log.y > 0.0) {
      pNext_log.y = log(pNext_log.y) / log(10.0);
    } else {
      pNext_log.y = -1000.0;
    }
  }

  vec2 pPrev_transformed = pPrev_log * lineScale + lineOffset;
  vec2 pNext_transformed = pNext_log * lineScale + lineOffset;
  vec2 pPrev_globally = pPrev_transformed * uGlobalScale + uGlobalOffset;
  vec2 pNext_globally = pNext_transformed * uGlobalScale + uGlobalOffset;

  vec2 dirFromPrev = p_globally_transformed - pPrev_globally;
  vec2 dirToNext = pNext_globally - p_globally_transformed;

  vec2 finalOffsetVector; // This will hold (normal * scale * side)

  if (aIsBevel > 0.5) {
        // --- Path for CPU-generated Bevels ---
        // Build screen-space normals for incoming and outgoing segments
        vec2 normalPrevScreen = screenNormalFromDir(dirFromPrev);
        vec2 normalNextScreen = screenNormalFromDir(dirToNext);

        // Match the provided bevel normal to the correct segment (incoming or outgoing)
        vec2 normalPrevData = vec2(0.0);
        vec2 normalNextData = vec2(0.0);

        vec2 dirPrevData = p_original - pPrev_original;
        float lenPrevData = length(dirPrevData);
        if (lenPrevData > 0.000001) {
          normalPrevData = vec2(-dirPrevData.y, dirPrevData.x) / lenPrevData;
        }

        vec2 dirNextData = pNext_original - p_original;
        float lenNextData = length(dirNextData);
        if (lenNextData > 0.000001) {
          normalNextData = vec2(-dirNextData.y, dirNextData.x) / lenNextData;
        }

        float matchPrev = dot(normalPrevData, aBevelNormal);
        float matchNext = dot(normalNextData, aBevelNormal);
        vec2 bevelNormalPixels = (matchPrev >= matchNext) ? normalPrevScreen : normalNextScreen;

        finalOffsetVector = thicknessOffsetFromNormal(bevelNormalPixels, desiredHalfPixelThickness, aSide);
  } else {
      // --- Path for Shader-calculated Normals (Miters and Line Ends) ---
      vec2 offsetNormalDir; // To be calculated by miter/end logic

      bool isFirstPoint = (localIndex == 0);
      bool isLastPoint = (localIndex == numPoints - 1);
      
      // Simplified logic with fewer branches
      if (isFirstPoint && isLastPoint) {
          // Single point case (should not happen with numPoints >= 2)
          offsetNormalDir = vec2(0.0, 1.0);
      } else if (isFirstPoint) {
          // Start of line - use next point direction
            offsetNormalDir = screenNormalFromDir(dirToNext);
      } else if (isLastPoint) {
            // End of line - use previous point direction  
            offsetNormalDir = screenNormalFromDir(dirFromPrev);
      } else {
          // Interior point - use simplified miter
            vec2 n0 = screenNormalFromDir(dirFromPrev);
            vec2 n1 = screenNormalFromDir(dirToNext);
            vec2 miterSum = n0 + n1;
            if (length(miterSum) > 0.00001) {
              offsetNormalDir = normalize(miterSum);
            } else {
              offsetNormalDir = n0; // Fallback to first normal
            }
      }

      // Calculate final offset using unified thickness calculation
          finalOffsetVector = thicknessOffsetFromNormal(offsetNormalDir, desiredHalfPixelThickness, aSide);
  }

  // Then apply screen-space thickness offset (calculated to be independent of zoom)
  vec2 finalPos = p_globally_transformed + finalOffsetVector;

  gl_Position = vec4(finalPos, 0.0, 1.0);
}
`, lt = `#version 300 es
precision mediump float;
flat in vec4 vColor; // Use 'flat' for no interpolation
out vec4 fragColor;
void main() {
  // Optional: Discard fully transparent fragments early
  if (vColor.a == 0.0) {
    discard;
  }
  fragColor = vColor;
}
`, L = 0, B = 16, E = 32, I = 48, _ = 4, D = 4, ft = 64, ht = 0.7, O = 1e-6;
function H(a, t, e) {
  const i = a.createShader(t);
  if (!i)
    throw new Error("Could not create shader object.");
  if (a.shaderSource(i, e), a.compileShader(i), !a.getShaderParameter(i, a.COMPILE_STATUS)) {
    const o = a.getShaderInfoLog(i);
    throw a.deleteShader(i), new Error(`Shader compile error: ${o}
Source:
${e}`);
  }
  return i;
}
function ct(a, t, e) {
  const i = H(a, a.VERTEX_SHADER, t), o = H(a, a.FRAGMENT_SHADER, e), r = a.createProgram();
  if (!r)
    throw a.deleteShader(i), a.deleteShader(o), new Error("Could not create program object.");
  if (a.attachShader(r, i), a.attachShader(r, o), a.linkProgram(r), a.detachShader(r, i), a.detachShader(r, o), a.deleteShader(i), a.deleteShader(o), !a.getProgramParameter(r, a.LINK_STATUS)) {
    const n = a.getProgramInfoLog(r);
    throw a.deleteProgram(r), new Error(`Program link error: ${n}`);
  }
  return r;
}
class T {
  gl;
  prog;
  maxLines;
  pointsTexture;
  vao;
  vertexBuffer;
  locations;
  // UBO
  lineDataUBO;
  lineDataUBObindingPoint = 0;
  lineDataStride = ft;
  lineDataArrayBuffer = new ArrayBuffer(0);
  lineDataView = new DataView(this.lineDataArrayBuffer);
  // Pre-allocated reusable buffers to avoid GC pressure
  reusableFloat32Array4 = new Float32Array(4);
  reusableInt32Array1 = new Int32Array(1);
  globalTransformDirty = !0;
  // State
  totalVertexCount = 0;
  numLines = 0;
  // Number of lines *initialized*
  totalValidPoints = 0;
  // Total points across all initialized lines
  // Points Data & Texture
  pointsData = new Float32Array(0);
  // CPU copy for updates, CPU scaling
  texWidth = 0;
  texHeight = 0;
  lineOriginalNumPointsCache = [];
  lineStartIndexCache = [];
  lineEnabledStatus = [];
  // Sharp turn detection cache (maps lineId -> sharpness flags array)
  sharpTurnCache = /* @__PURE__ */ new Map();
  pointsHashCache = /* @__PURE__ */ new Map();
  // To detect when points change
  // Global Transform (using simple arrays)
  globalScale = [1, 1];
  globalOffset = [0, 0];
  // Log axis flags
  logX = !1;
  logY = !1;
  /**
   * Creates an instance of WebglLineThick.
   * @param gl WebGL2 rendering context.
   * @param maxLines Maximum number of lines this instance can handle.
   */
  constructor(t, e) {
    this.gl = t, this.maxLines = Math.max(1, e);
    const i = at(this.maxLines), o = lt;
    try {
      this.prog = ct(this.gl, i, o);
    } catch (l) {
      throw f.error(`Error creating main GL program: ${l}`), this.prog = null, l;
    }
    this.gl.useProgram(this.prog), this.locations = {
      uPointsTex: this.gl.getUniformLocation(this.prog, "uPointsTex"),
      uTexWidth: this.gl.getUniformLocation(this.prog, "uTexWidth"),
      uTexHeight: this.gl.getUniformLocation(this.prog, "uTexHeight"),
      uGlobalScale: this.gl.getUniformLocation(this.prog, "uGlobalScale"),
      uGlobalOffset: this.gl.getUniformLocation(this.prog, "uGlobalOffset"),
      uViewportSize: this.gl.getUniformLocation(this.prog, "uViewportSize"),
      uLogAxis: this.gl.getUniformLocation(this.prog, "uLogAxis")
    }, this.locations.uPointsTex || f.warn("Main uniform 'uPointsTex' not found."), this.locations.uTexWidth || f.warn("Main uniform 'uTexWidth' not found."), this.locations.uTexHeight || f.warn("Main uniform 'uTexHeight' not found."), this.locations.uGlobalScale || f.warn("Main uniform 'uGlobalScale' not found."), this.locations.uGlobalOffset || f.warn("Main uniform 'uGlobalOffset' not found."), this.locations.uViewportSize || f.warn("Main uniform 'uViewportSize' not found.");
    const r = "LineDataBlock", n = this.gl.getUniformBlockIndex(this.prog, r);
    if (n === this.gl.INVALID_INDEX ? f.warn(
      `Main program: Uniform block '${r}' not found or not active.`
    ) : this.gl.uniformBlockBinding(
      this.prog,
      n,
      this.lineDataUBObindingPoint
    ), this.locations.uPointsTex && this.gl.uniform1i(this.locations.uPointsTex, 0), this.lineDataUBO = this.gl.createBuffer(), !this.lineDataUBO) throw new Error("Failed to create UBO buffer.");
    if (this.pointsTexture = this.gl.createTexture(), !this.pointsTexture)
      throw new Error("Failed to create points texture.");
    if (this.vertexBuffer = this.gl.createBuffer(), !this.vertexBuffer) throw new Error("Failed to create vertex buffer.");
    if (this.vao = this.gl.createVertexArray(), !this.vao) throw new Error("Failed to create vertex array object.");
    this.gl.bindVertexArray(this.vao), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const s = 6 * _;
    this.setupVertexAttributes([
      { name: "aLineId", size: 1, offset: 0 * _ },
      { name: "aIndex", size: 1, offset: 1 * _ },
      { name: "aIsBevel", size: 1, offset: 2 * _ },
      { name: "aBevelNormal", size: 2, offset: 3 * _ },
      { name: "aSide", size: 1, offset: 5 * _ }
    ], s), this.gl.bindVertexArray(null), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), this.lineEnabledStatus = new Array(this.maxLines).fill(!1), this.lineOriginalNumPointsCache = new Array(this.maxLines).fill(0), this.lineStartIndexCache = new Array(this.maxLines).fill(0), this.setGlobalTransform(this.globalScale, this.globalOffset), this.gl.useProgram(null), this.gl.enable(this.gl.BLEND), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }
  /**
   * Initializes or updates line data, including points texture, VBO, UBO,
   * and potentially GPU reduction resources.
   * @param lines An array of line objects to draw.
   */
  initLines(t) {
    const e = this.gl;
    if (!this.prog) {
      f.error("Cannot initLines, main program not initialized.");
      return;
    }
    t.length > this.maxLines && (f.warn(
      `initLines: Attempted to initialize with ${t.length} lines, but maxLines is ${this.maxLines}. Truncating.`
    ), t = t.slice(0, this.maxLines));
    const i = [];
    let o = 0;
    this.totalValidPoints = 0, this.lineOriginalNumPointsCache.fill(0), this.lineStartIndexCache.fill(0), this.lineEnabledStatus.fill(!1);
    for (let g = 0; g < t.length; g++) {
      const p = t[g], b = p.scale || [1, 1], v = p.offset || [0, 0], P = p.thickness === void 0 ? 1 : p.thickness, S = p.enabled === void 0 ? !0 : p.enabled, F = p.points.length / 2;
      if (F >= 2) {
        const w = i.length;
        i.push({
          // Store a version of the line config with defaults applied for processing
          lineObj: { ...p, scale: b, offset: v, thickness: P, enabled: S },
          startIndex: o,
          numPoints: F,
          enabled: S
          // Store initial enabled state
        }), this.lineOriginalNumPointsCache[w] = F, this.lineStartIndexCache[w] = o, this.lineEnabledStatus[w] = S, o += F, this.totalValidPoints += F;
      } else
        f.warn(
          `initLines: Skipping line index ${g} with ${F} points.`
        );
    }
    if (this.numLines = i.length, this.numLines === 0) {
      this.totalVertexCount = 0, this.totalValidPoints = 0, this.pointsData = new Float32Array(0), e.activeTexture(e.TEXTURE0), this.pointsTexture && (e.bindTexture(e.TEXTURE_2D, this.pointsTexture), e.texImage2D(
        e.TEXTURE_2D,
        0,
        e.RG32F,
        1,
        1,
        0,
        e.RG,
        e.FLOAT,
        new Float32Array([0, 0])
      )), this.texWidth = 1, this.texHeight = 1;
      const g = this.maxLines * this.lineDataStride;
      this.lineDataArrayBuffer.byteLength !== g ? (this.lineDataArrayBuffer = new ArrayBuffer(g), this.lineDataView = new DataView(this.lineDataArrayBuffer)) : new Float32Array(this.lineDataArrayBuffer).fill(0), this.lineDataUBO && (e.bindBuffer(e.UNIFORM_BUFFER, this.lineDataUBO), e.bufferData(
        e.UNIFORM_BUFFER,
        this.lineDataArrayBuffer,
        e.DYNAMIC_DRAW
      ), e.bindBuffer(e.UNIFORM_BUFFER, null), e.bindBufferBase(
        e.UNIFORM_BUFFER,
        this.lineDataUBObindingPoint,
        this.lineDataUBO
      )), this.vertexBuffer && (e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, 0, e.STATIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null)), e.useProgram(this.prog), this.locations.uTexWidth && e.uniform1i(this.locations.uTexWidth, this.texWidth), this.locations.uTexHeight && e.uniform1i(this.locations.uTexHeight, this.texHeight), f.warn(
        "initLines called with no valid lines. Renderer resources cleared/reset."
      );
      return;
    }
    const r = new Float32Array(this.totalValidPoints * 2);
    let n = 0;
    for (const g of i) {
      const p = g.lineObj.points;
      r.set(p, n), n += p.length;
    }
    const s = e.getParameter(e.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(Math.max(1, this.totalValidPoints), s), this.texHeight = Math.ceil(this.totalValidPoints / this.texWidth), this.texHeight > s && (f.error("Required texture height exceeds MAX_TEXTURE_SIZE!"), this.texHeight = s);
    const l = this.texWidth * this.texHeight;
    this.pointsData.length < l * 2 ? this.pointsData = new Float32Array(l * 2) : this.pointsData.fill(0, 0, l * 2), this.pointsData.set(r), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, this.pointsTexture), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texImage2D(
      e.TEXTURE_2D,
      0,
      e.RG32F,
      this.texWidth,
      this.texHeight,
      0,
      e.RG,
      e.FLOAT,
      this.pointsData
    );
    const h = 6, d = (g, p) => [g[0] - p[0], g[1] - p[1]], m = (g) => {
      const p = Math.sqrt(g[0] * g[0] + g[1] * g[1]);
      return p > O ? [g[0] / p, g[1] / p] : [0, 0];
    }, A = /* @__PURE__ */ new Map();
    let x = 0;
    for (let g = 0; g < this.numLines; g++) {
      const p = i[g], b = p.lineObj.points, v = p.numPoints, P = this.computeSharpTurns(g, b, v);
      A.set(g, P);
      for (let S = 0; S < v; S++)
        S > 0 && S < v - 1 && P[S] ? x += 4 : x += 2;
    }
    this.numLines > 1 && (x += (this.numLines - 1) * 4), this.totalVertexCount = x;
    const u = new Float32Array(this.totalVertexCount * h);
    let c = 0;
    for (let g = 0; g < this.numLines; g++) {
      const p = i[g], b = p.lineObj.points, v = p.numPoints, P = A.get(g) || [];
      for (let S = 0; S < v; S++)
        if (P[S]) {
          const w = [b[S * 2], b[S * 2 + 1]], rt = [b[(S - 1) * 2], b[(S - 1) * 2 + 1]], nt = [b[(S + 1) * 2], b[(S + 1) * 2 + 1]], M = m(d(w, rt)), W = m(d(nt, w)), V = [-M[1], M[0]], Y = [-W[1], W[0]];
          u[c++] = g, u[c++] = S, u[c++] = 1, u[c++] = V[0], u[c++] = V[1], u[c++] = -1, u[c++] = g, u[c++] = S, u[c++] = 1, u[c++] = V[0], u[c++] = V[1], u[c++] = 1, u[c++] = g, u[c++] = S, u[c++] = 1, u[c++] = Y[0], u[c++] = Y[1], u[c++] = -1, u[c++] = g, u[c++] = S, u[c++] = 1, u[c++] = Y[0], u[c++] = Y[1], u[c++] = 1;
        } else
          u[c++] = g, u[c++] = S, u[c++] = 0, u[c++] = 0, u[c++] = 0, u[c++] = -1, u[c++] = g, u[c++] = S, u[c++] = 0, u[c++] = 0, u[c++] = 0, u[c++] = 1;
      if (g < this.numLines - 1) {
        const S = this.lineOriginalNumPointsCache[g] - 1, F = 0;
        u[c++] = g, u[c++] = S, u[c++] = 0, u[c++] = 0, u[c++] = 0, u[c++] = 1, u[c++] = g, u[c++] = S, u[c++] = 0, u[c++] = 0, u[c++] = 0, u[c++] = 1, u[c++] = g + 1, u[c++] = F, u[c++] = 0, u[c++] = 0, u[c++] = 0, u[c++] = -1, u[c++] = g + 1, u[c++] = F, u[c++] = 0, u[c++] = 0, u[c++] = 0, u[c++] = -1;
      }
    }
    e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, u, e.STATIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null);
    const y = this.maxLines * this.lineDataStride;
    this.lineDataArrayBuffer.byteLength !== y ? (this.lineDataArrayBuffer = new ArrayBuffer(y), this.lineDataView = new DataView(this.lineDataArrayBuffer)) : new Float32Array(this.lineDataArrayBuffer).fill(0);
    for (let g = 0; g < this.numLines; g++) {
      const p = i[g], b = p.lineObj, v = g * this.lineDataStride;
      this.lineDataView.setFloat32(v + L + 0 * _, b.scale[0], !0), this.lineDataView.setFloat32(v + L + 1 * _, b.scale[1], !0), this.lineDataView.setFloat32(v + L + 2 * _, b.offset[0], !0), this.lineDataView.setFloat32(v + L + 3 * _, b.offset[1], !0), this.lineDataView.setFloat32(v + B + 0 * _, b.color[0], !0), this.lineDataView.setFloat32(v + B + 1 * _, b.color[1], !0), this.lineDataView.setFloat32(v + B + 2 * _, b.color[2], !0), this.lineDataView.setFloat32(v + B + 3 * _, b.color[3], !0), this.lineDataView.setInt32(v + E + 0 * D, p.startIndex, !0), this.lineDataView.setInt32(v + E + 1 * D, p.enabled ? p.numPoints : 0, !0), this.lineDataView.setInt32(v + E + 2 * D, 0, !0), this.lineDataView.setInt32(v + E + 3 * D, 0, !0), this.lineDataView.setFloat32(v + I, b.thickness, !0);
    }
    e.bindBuffer(e.UNIFORM_BUFFER, this.lineDataUBO), e.bufferData(e.UNIFORM_BUFFER, this.lineDataArrayBuffer, e.DYNAMIC_DRAW), e.bindBuffer(e.UNIFORM_BUFFER, null), e.bindBufferBase(
      e.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    ), e.useProgram(this.prog), this.locations.uTexWidth && e.uniform1i(this.locations.uTexWidth, this.texWidth), this.locations.uTexHeight && e.uniform1i(this.locations.uTexHeight, this.texHeight);
  }
  /**
   * Sets the global scale and offset applied AFTER per-line transforms.
   * @param scale Tuple `[scaleX, scaleY]`.
   * @param offset Tuple `[offsetX, offsetY]`.
   */
  setGlobalTransform(t, e) {
    (this.globalScale[0] !== t[0] || this.globalScale[1] !== t[1] || this.globalOffset[0] !== e[0] || this.globalOffset[1] !== e[1]) && (this.globalScale[0] = t[0], this.globalScale[1] = t[1], this.globalOffset[0] = e[0], this.globalOffset[1] = e[1], this.globalTransformDirty = !0);
  }
  /**
   * Get the data bounds of all enabled lines (for autoscaling purposes).
   * This returns the complete extent of all data and should be used with autoScale().
   * For preserving current coordinate space, use getDataBounds() instead.
   * @returns Object with minX, maxX, minY, maxY of all the data, or null if no valid data
   */
  getAllDataBounds() {
    return this._computeBoundsCPU();
  }
  /**
   * Get the data bounds of the current coordinate space (viewport).
   * This preserves the current zoom/pan when transforming to log space.
   * Use this with transformToLogSpace() to maintain user's coordinate space.
   * @returns Object with minX, maxX, minY, maxY of the current view with coordinate space information, or null if invalid transform
   */
  getDataBounds() {
    return C(this.globalScale, this.globalOffset, this.logX, this.logY);
  }
  /**
   * Computes the min/max bounds of enabled lines using CPU iteration.
   * Internal method.
   * @returns DataBounds object or null if no enabled lines with points found.
   */
  _computeBoundsCPU() {
    let t = 1 / 0, e = -1 / 0, i = 1 / 0, o = -1 / 0, r = !1;
    for (let n = 0; n < this.numLines; n++)
      if (this.lineEnabledStatus[n]) {
        const s = this.lineStartIndexCache[n], l = this.lineOriginalNumPointsCache[n];
        if (l > 0) {
          const h = new Float32Array(this.pointsData.buffer, s * 8, l * 2), d = X(h, this.logX, this.logY);
          if (!d.isValid) {
            f.log(`_computeBoundsCPU: Skipping line ${n} - only ${d.validPointCount}/${d.totalPoints} (${(d.validRatio * 100).toFixed(1)}%) points valid for log axes`);
            continue;
          }
          r = !0;
          const m = Q(h, this.logX, this.logY);
          m && (m.minX < t && (t = m.minX), m.maxX > e && (e = m.maxX), m.minY < i && (i = m.minY), m.maxY > o && (o = m.maxY));
        }
      }
    return r ? !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(o) ? (f.warn("_computeBoundsCPU: Resulting bounds NaN/Infinity."), null) : {
      minX: t,
      maxX: e,
      minY: i,
      maxY: o,
      coordinateSpace: {
        x: this.logX ? "log" : "linear",
        y: this.logY ? "log" : "linear"
      }
    } : null;
  }
  /**
   * Auto-scale to fit all enabled lines in the current coordinate space.
   *
   * **IMPORTANT**: This method operates within the current coordinate space (linear or log)
   * and does NOT change coordinate spaces. It calculates bounds appropriate for the current
   * axis configuration and applies the transform.
   *
   * **Use autoScale() when:**
   * - Want to fit all data in the current coordinate space
   * - Need simple auto-scaling without changing coordinate spaces
   * - Don't need to preserve current zoom/pan state
   *
   * **⚠️ WARNING: Do NOT combine autoScale() with coordinate transforms!**
   * - autoScale() already works in the current coordinate space
   * - Calling transformToLogSpace() after autoScale() causes double-conversion
   *
   * **For coordinate space changes, use:**
   * - `transformToLogSpace()` - Switch to or operate in log space
   * - `transformToLinearSpace()` - Switch to or operate in linear space
   *
   * @returns DataBounds object with calculated bounds in current coordinate space, or null if no valid data
   *
   * @example
   * ```typescript
   * // ✅ CORRECT: Simple auto-scaling in current coordinate space
   * plotter.setLogAxis(false, true); // Enable log Y
   * plotter.autoScale(); // Auto-scales in log Y space - NO conversion needed!
   * 
   * // ❌ WRONG: Don't combine autoScale() with coordinate transforms
   * // const bounds = plotter.autoScale();
   * // plotter.transformToLogSpace(bounds); // This causes double-conversion!
   * 
   * // ✅ CORRECT: For coordinate space conversion, use getAllDataBounds():
   * // plotter.setLogAxis(false, true); // Enable log Y
   * // const bounds = plotter.getAllDataBounds(); // Gets linear data bounds
   * // if (bounds) plotter.transformToLogSpace(bounds); // Converts to log space
   * ```
   */
  autoScale() {
    if (this.numLines === 0)
      return f.warn("autoScale: No lines initialized."), null;
    let t = null;
    if (console.time("CPU Bounds Calculation"), t = this._computeBoundsCPU(), console.timeEnd("CPU Bounds Calculation"), !t)
      return f.warn(
        "autoScale: No valid data bounds found. Setting global transform to default."
      ), this.setGlobalTransform([1, 1], [0, 0]), null;
    const { minX: e, maxX: i, minY: o, maxY: r } = t, [n, s, l, h] = U(t);
    return f.log(
      `AutoScale Results: Bounds [${e.toFixed(3)}, ${i.toFixed(
        3
      )}], [${o.toFixed(3)}, ${r.toFixed(
        3
      )}] -> Global Scale: [${n.toFixed(4)}, ${s.toFixed(
        4
      )}], Offset: [${l.toFixed(4)}, ${h.toFixed(4)}]`
    ), this.setGlobalTransform([n, s], [l, h]), t;
  }
  /**
   * Computes sharp turn detection for a line with caching and optimizations.
   * @param lineId Line identifier
   * @param pointsArray Points array for the line
   * @param numPts Number of points in the line
   * @returns Boolean array indicating sharp turns for each point
   */
  computeSharpTurns(t, e, i) {
    const o = `${i}_${e[0]}_${e[1]}_${e[i * 2 - 2]}_${e[i * 2 - 1]}`;
    if (this.sharpTurnCache.has(t) && this.pointsHashCache.get(t) === o)
      return this.sharpTurnCache.get(t);
    const r = new Array(i).fill(!1);
    if (i >= 3) {
      const n = ht;
      for (let s = 1; s < i - 1; s++) {
        const l = e[(s - 1) * 2], h = e[(s - 1) * 2 + 1], d = e[s * 2], m = e[s * 2 + 1], A = e[(s + 1) * 2], x = e[(s + 1) * 2 + 1];
        let u = d - l, c = m - h, y = A - d, g = x - m;
        const p = u * u + c * c, b = y * y + g * g;
        if (p < O * O || b < O * O)
          continue;
        const v = Math.sqrt(p), P = Math.sqrt(b);
        u /= v, c /= v, y /= P, g /= P, u * y + c * g < n && (r[s] = !0);
      }
    }
    return this.sharpTurnCache.set(t, r), this.pointsHashCache.set(t, o), r;
  }
  /**
   * Helper to setup vertex attributes with error handling.
   * @param attributes Array of attribute configurations
   * @param stride Vertex stride in bytes
   */
  setupVertexAttributes(t, e) {
    const i = this.gl;
    for (const o of t) {
      const r = i.getAttribLocation(this.prog, o.name);
      r === -1 ? f.warn(`Attribute '${o.name}' not found in main program.`) : (i.enableVertexAttribArray(r), i.vertexAttribPointer(
        r,
        o.size,
        i.FLOAT,
        !1,
        e,
        o.offset
      ));
    }
  }
  /**
   * Generic helper to update UBO data and sync with GPU buffer.
   * @param byteOffsets Array of byte offsets to update
   * @param dataViews Array of typed array views containing the data
   */
  updateUBOData(t, e) {
    const i = this.gl;
    if (!(!this.lineDataUBO || t.length !== e.length)) {
      i.bindBuffer(i.UNIFORM_BUFFER, this.lineDataUBO);
      for (let o = 0; o < t.length; o++)
        i.bufferSubData(i.UNIFORM_BUFFER, t[o], e[o]);
      i.bindBuffer(i.UNIFORM_BUFFER, null);
    }
  }
  /**
   * Updates the per-line transform (scale and offset) for multiple lines using UBO updates.
   */
  updateLinesTransform(t, e, i) {
    if (!this.lineDataUBO) {
      f.warn("updateLinesTransform: UBO not available.");
      return;
    }
    const o = [], r = [];
    for (const n of t) {
      if (n < 0 || n >= this.numLines) {
        f.warn(`updateLinesTransform: Invalid lineId ${n}.`);
        continue;
      }
      const s = n * this.lineDataStride + L;
      this.lineDataView.setFloat32(s + 0 * _, e[0], !0), this.lineDataView.setFloat32(s + 1 * _, e[1], !0), this.lineDataView.setFloat32(s + 2 * _, i[0], !0), this.lineDataView.setFloat32(s + 3 * _, i[1], !0);
      const l = new Float32Array(this.lineDataArrayBuffer, s, 4);
      o.push(s), r.push(l);
    }
    o.length > 0 && this.updateUBOData(o, r);
  }
  /**
   * Updates the per-line transform for a specific line.
   */
  updateLineTransform(t, e, i) {
    this.updateLinesTransform([t], e, i);
  }
  /**
   * Updates the color for a specific line.
   */
  updateLineColor(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`updateLineColor: Invalid lineId ${t}`);
      return;
    }
    if (!this.lineDataUBO) {
      f.warn("updateLineColor: UBO not available.");
      return;
    }
    const i = t * this.lineDataStride + B;
    this.lineDataView.setFloat32(i + 0 * _, e[0], !0), this.lineDataView.setFloat32(i + 1 * _, e[1], !0), this.lineDataView.setFloat32(i + 2 * _, e[2], !0), this.lineDataView.setFloat32(i + 3 * _, e[3], !0), this.reusableFloat32Array4.set(e), this.updateUBOData([i], [this.reusableFloat32Array4]);
  }
  /**
   * Updates the thickness for a specific line.
   */
  updateLineThickness(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`updateLineThickness: Invalid lineId ${t}`);
      return;
    }
    if (!this.lineDataUBO) {
      f.warn("updateLineThickness: UBO not available.");
      return;
    }
    const i = t * this.lineDataStride + I;
    this.lineDataView.setFloat32(i, e, !0), this.reusableFloat32Array4[0] = e, this.updateUBOData([i], [this.reusableFloat32Array4.subarray(0, 1)]);
  }
  /**
   * Enables or disables rendering of specific lines.
   */
  setLinesEnabled(t, e) {
    if (!this.lineDataUBO) {
      f.warn("setLinesEnabled: UBO not available.");
      return;
    }
    const i = [];
    for (const o of t) {
      if (o < 0 || o >= this.numLines) {
        f.warn(`setLinesEnabled: Invalid lineId ${o}.`);
        continue;
      }
      if (this.lineEnabledStatus[o] !== e) {
        this.lineEnabledStatus[o] = e;
        const r = e ? this.lineOriginalNumPointsCache[o] : 0, n = o * this.lineDataStride + E + 1 * D;
        this.lineDataView.setInt32(n, r, !0), i.push({ byteOffset: n, numPoints: r });
      }
    }
    if (i.length > 0) {
      const o = [], r = [];
      for (const n of i)
        this.reusableInt32Array1[0] = n.numPoints, o.push(n.byteOffset), r.push(this.reusableInt32Array1.slice());
      this.updateUBOData(o, r);
    }
  }
  /**
   * Enables or disables rendering of a single line.
   */
  setLineEnabled(t, e) {
    this.setLinesEnabled([t], e);
  }
  /**
   * Enable or disable logarithmic scaling for X and/or Y axes.
   * 
   * When enabled, coordinates are transformed using log₁₀ on the GPU in real-time.
   * Negative and zero values are automatically filtered out (moved off-screen).
   * 
   * **Important Notes:**
   * - Transformation happens on GPU for optimal performance
   * - No graph reinitialization required - changes apply immediately
   * - Auto-scaling will automatically account for log transformation
   * 
   * **Example Usage:**
   * ```typescript
   * // Enable log Y-axis for exponential data
   * thickPlotter.setLogAxis(false, true);
   * 
   * // Enable both axes for power-law data
   * thickPlotter.setLogAxis(true, true);
   * 
   * // Disable all log scaling
   * thickPlotter.setLogAxis(false, false);
   * ```
   * 
   * @param x Enable logarithmic base-10 scaling for X-axis
   * @param y Enable logarithmic base-10 scaling for Y-axis
   */
  setLogAxis(t, e) {
    this.logX = t, this.logY = e;
  }
  /**
   * Auto-scale the plotter to fit log-transformed data, using either actual data bounds
   * or converting existing transform-based viewport bounds to log space.
   * 
   * This function intelligently handles the transition from linear to log space by
   * using actual data bounds when provided, or falling back to transforming the 
   * current viewport bounds from linear to log space.
   * 
   * **Use Cases:**
   * - After toggling log axes to maintain current view
   * - For smooth transitions between linear and log representations  
   * - When you want to preserve user's current zoom/pan state
   * - For accurate scaling based on actual data bounds
   * 
   * **Example Usage:**
   * ```typescript
   * // Preserve current coordinate space (recommended for maintaining zoom/pan)
   * const bounds = thickPlotter.getDataBounds();
   * thickPlotter.transformToLogSpace(bounds);
   * 
   * // Alternative: same result, preserves current coordinate space
   * thickPlotter.transformToLogSpace();
   * ```
   * 
   * @param dataBounds Optional actual data bounds {minX, maxX, minY, maxY}. 
   *                   If provided, uses actual data bounds instead of transform-based bounds.
   * @returns True if smart scaling was applied, false if transformation not feasible
   */
  transformToLogSpace(t) {
    if (!this.logX && !this.logY)
      return f.log("transformToLogSpace: No log axes enabled, no scaling needed"), !0;
    let e;
    t ? (e = t, f.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), f.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (this.logX && e.coordinateSpace.x === "log" || this.logY && e.coordinateSpace.y === "log") && (f.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = k(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), f.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));
    const o = tt(i, this.logX, this.logY);
    if (!o)
      return f.log("transformToLogSpace: Cannot transform bounds to log space"), !1;
    const [r, n, s, l] = U(o);
    return this.setGlobalTransform([r, n], [s, l]), f.log(`transformToLogSpace: Applied new transform - Scale[${r.toFixed(4)}, ${n.toFixed(4)}], Offset[${s.toFixed(4)}, ${l.toFixed(4)}]`), !0;
  }
  /**
   * Transform data bounds to linear space and apply appropriate scaling.
   *
   * **ENHANCED**: This method automatically handles coordinate space conversion.
   * It detects the coordinate space of input bounds and converts as needed.
   *
   * **Typical usage patterns:**
   * - **Switching to linear axes**: `getDataBounds()` → `transformToLinearSpace()` (preserves view)
   * - **Zoom/pan in linear space**: `getDataBounds()` → `transformToLinearSpace()`
   * - **Initial linear setup**: `getAllDataBounds()` → `transformToLinearSpace()`
   *
   * @param dataBounds Optional data bounds with coordinate space information.
   *                   If not provided, will attempt to get bounds from current transform.
   * @returns True if linear space transformation was applied successfully,
   *          false if transformation not feasible
   *
   * @example
   * ```typescript
   * // Switching from log to linear axes while preserving view
   * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
   * plotter.setLogAxis(false, false); // Switch to linear axes
   * const success = plotter.transformToLinearSpace(bounds); // Preserves current view
   * 
   * // Works seamlessly from any coordinate mode
   * const currentBounds = plotter.getDataBounds(); 
   * plotter.transformToLinearSpace(currentBounds); // Always handles conversion correctly!
   * ```
   */
  transformToLinearSpace(t) {
    let e;
    t ? (e = t, f.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), f.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (e.coordinateSpace.x === "log" || e.coordinateSpace.y === "log") && (f.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = k(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), f.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)), i.coordinateSpace = {
      x: "linear",
      y: "linear"
    };
    const [o, r, n, s] = U(i);
    return this.setGlobalTransform([o, r], [n, s]), f.log(`transformToLinearSpace: Applied linear transform - Scale[${o.toFixed(4)}, ${r.toFixed(4)}], Offset[${n.toFixed(4)}, ${s.toFixed(4)}]`), !0;
  }
  /**
   * Updates only the Y coordinates of the points for a given line.
   */
  updateLineY(t, e) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`updateLineY: Invalid lineId ${t}`);
      return;
    }
    if (!this.pointsTexture) {
      f.warn("updateLineY: pointsTexture is null.");
      return;
    }
    const i = this.lineOriginalNumPointsCache[t];
    if (e.length !== i)
      throw new Error(
        `Line ${t}: Length mismatch for updateLineY. Expected ${i}, got ${e.length}.`
      );
    if (i <= 0) return;
    const o = this.gl, r = this.lineStartIndexCache[t];
    for (let n = 0; n < i; n++) {
      const s = (r + n) * 2 + 1;
      if (s < this.pointsData.length)
        this.pointsData[s] = e[n];
      else {
        f.error(
          `updateLineY: Index ${s} OOB length ${this.pointsData.length}.`
        );
        return;
      }
    }
    if (o.activeTexture(o.TEXTURE0), o.bindTexture(o.TEXTURE_2D, this.pointsTexture), i <= this.texWidth) {
      const n = Math.floor(r / this.texWidth), s = r % this.texWidth;
      if (s + i <= this.texWidth) {
        const l = r * 2, h = i * 2, d = new Float32Array(
          this.pointsData.buffer,
          this.pointsData.byteOffset + l * _,
          h
        );
        o.texSubImage2D(o.TEXTURE_2D, 0, s, n, i, 1, o.RG, o.FLOAT, d);
      } else
        this.updateTextureByRows(o, r, i);
    } else
      this.updateTextureByRows(o, r, i);
    o.bindTexture(o.TEXTURE_2D, null);
  }
  /**
   * Helper method to update texture data row by row.
   * @param gl WebGL context
   * @param startIdx Starting global point index
   * @param numPts Number of points to update
   */
  updateTextureByRows(t, e, i) {
    let o = e;
    const r = e + i;
    for (; o < r; ) {
      const n = Math.floor(o / this.texWidth), s = o % this.texWidth, l = this.texWidth - s, h = r - o, d = Math.min(l, h);
      if (d <= 0) break;
      const m = o * 2, A = d * 2, x = new Float32Array(
        this.pointsData.buffer,
        this.pointsData.byteOffset + m * _,
        A
      );
      t.texSubImage2D(t.TEXTURE_2D, 0, s, n, d, 1, t.RG, t.FLOAT, x), o += d;
    }
  }
  /**
   * Draws the lines managed by this instance.
   */
  draw() {
    const t = this.gl;
    this.totalVertexCount === 0 || !this.prog || !this.vao || !this.pointsTexture || !this.lineDataUBO || (t.useProgram(this.prog), this.globalTransformDirty && (this.locations.uGlobalScale && t.uniform2f(
      this.locations.uGlobalScale,
      this.globalScale[0],
      this.globalScale[1]
    ), this.locations.uGlobalOffset && t.uniform2f(
      this.locations.uGlobalOffset,
      this.globalOffset[0],
      this.globalOffset[1]
    ), this.globalTransformDirty = !1), this.locations.uViewportSize && t.uniform2f(this.locations.uViewportSize, t.canvas.width, t.canvas.height), this.locations.uLogAxis && t.uniform2f(
      this.locations.uLogAxis,
      this.logX ? 1 : 0,
      this.logY ? 1 : 0
    ), t.activeTexture(t.TEXTURE0), t.bindTexture(t.TEXTURE_2D, this.pointsTexture), t.bindBufferBase(
      t.UNIFORM_BUFFER,
      this.lineDataUBObindingPoint,
      this.lineDataUBO
    ), t.bindVertexArray(this.vao), t.drawArrays(t.TRIANGLE_STRIP, 0, this.totalVertexCount), t.bindVertexArray(null), t.bindTexture(t.TEXTURE_2D, null), t.bindBufferBase(t.UNIFORM_BUFFER, this.lineDataUBObindingPoint, null), t.bindBuffer(t.UNIFORM_BUFFER, null), t.useProgram(null));
  }
  /**
   * Releases all WebGL resources allocated by this instance.
   */
  cleanup() {
    const t = this.gl;
    f.log("Cleaning up WebglLineThick resources..."), this.prog && (t.deleteProgram(this.prog), this.prog = null), this.pointsTexture && (t.deleteTexture(this.pointsTexture), this.pointsTexture = null), this.vertexBuffer && (t.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.lineDataUBO && (t.deleteBuffer(this.lineDataUBO), this.lineDataUBO = null), this.vao && (t.deleteVertexArray(this.vao), this.vao = null), this.pointsData = new Float32Array(0), this.lineDataArrayBuffer = new ArrayBuffer(0), this.lineDataView = new DataView(this.lineDataArrayBuffer), this.numLines = 0, this.totalVertexCount = 0, this.totalValidPoints = 0, this.lineOriginalNumPointsCache = [], this.lineStartIndexCache = [], this.lineEnabledStatus = [], this.sharpTurnCache.clear(), this.pointsHashCache.clear(), this.locations = {
      uPointsTex: null,
      uTexWidth: null,
      uTexHeight: null,
      uGlobalScale: null,
      uGlobalOffset: null,
      uViewportSize: null,
      uLogAxis: null
    }, this.globalScale = [1, 1], this.globalOffset = [0, 0], f.log("WebglLineThick resources cleaned up.");
  }
  /**
   * Gets the configuration for a specific line by reading from the UBO data view.
   * Note: This returns a partial LineConfig as not all original data might be stored or easily retrievable.
   * Specifically, 'points' are on the GPU texture and not returned here.
   * @param lineId The ID of the line.
   * @returns A Partial<LineConfig> object or undefined if not found or UBO not ready.
   */
  getLineConfig(t) {
    if (t < 0 || t >= this.numLines) {
      f.warn(`Invalid lineId ${t} for getLineConfig`);
      return;
    }
    if (!this.lineDataView || this.lineDataArrayBuffer.byteLength === 0) {
      f.warn("getLineConfig: Line data view or UBO not initialized.");
      return;
    }
    const e = t * this.lineDataStride;
    if (e + I + _ > this.lineDataView.byteLength) {
      f.warn(`getLineConfig: lineId ${t} results in offset out of bounds for lineDataView.`);
      return;
    }
    const i = {};
    i.scale = [
      this.lineDataView.getFloat32(e + L + 0 * _, !0),
      this.lineDataView.getFloat32(e + L + 1 * _, !0)
    ], i.offset = [
      this.lineDataView.getFloat32(e + L + 2 * _, !0),
      this.lineDataView.getFloat32(e + L + 3 * _, !0)
    ], i.color = [
      this.lineDataView.getFloat32(e + B + 0 * _, !0),
      this.lineDataView.getFloat32(e + B + 1 * _, !0),
      this.lineDataView.getFloat32(e + B + 2 * _, !0),
      this.lineDataView.getFloat32(e + B + 3 * _, !0)
    ], i.thickness = this.lineDataView.getFloat32(e + I, !0);
    const o = this.lineDataView.getInt32(e + E + 1 * D, !0);
    return i.enabled = o > 0, i;
  }
  /**
   * Get the current global transform scale values.
   * @returns [scaleX, scaleY] array
   */
  getGlobalScale() {
    return [this.globalScale[0], this.globalScale[1]];
  }
  /**
   * Get the current global transform offset values.
   * @returns [offsetX, offsetY] array
   */
  getGlobalOffset() {
    return [this.globalOffset[0], this.globalOffset[1]];
  }
}
class ut {
  gl;
  maxLines;
  internalPlotter = null;
  constructor(t, e) {
    this.gl = t, this.maxLines = e;
  }
  /**
   * Initializes or re-initializes lines. Determines the internal plotter type
   * based on the thickness of the first line in the configuration array.
   * @param linesConfig Array of LineConfig objects.
   */
  initLines(t) {
    if (!t || t.length === 0) {
      this.internalPlotter && this.internalPlotter.initLines([]);
      return;
    }
    let e = t[0].thickness;
    if (e === void 0 && (e = 1), e < 1 && (e = 1), e <= 1) {
      this.internalPlotter instanceof R || (this.internalPlotter && this.internalPlotter.cleanup(), this.internalPlotter = new R(this.gl, this.maxLines));
      const o = t.map((r) => ({
        ...r,
        thickness: 1
        // All lines will be 1.0 for WebglLinePlot via this unified interface
      }));
      this.internalPlotter.initLines(o);
    } else
      this.internalPlotter instanceof T || (this.internalPlotter && this.internalPlotter.cleanup(), this.internalPlotter = new T(this.gl, this.maxLines)), this.internalPlotter.initLines(t);
  }
  // --- Delegated Methods ---
  draw() {
    this.internalPlotter && this.internalPlotter.draw();
  }
  cleanup() {
    this.internalPlotter && (this.internalPlotter.cleanup(), this.internalPlotter = null);
  }
  updateLinePoints(t, e) {
    this.internalPlotter instanceof R ? this.internalPlotter.updateLinePoints(t, e) : this.internalPlotter instanceof T ? f.warn(
      "updateLinePoints(xy) is not directly supported when WebglLineThick is active. Consider re-initializing the line with initLines() for full XY updates, or use updateLineY() if only Y values need changing and X values are stable."
    ) : f.warn("updateLinePoints: plotter not initialized.");
  }
  updateLineY(t, e) {
    this.internalPlotter && this.internalPlotter.updateLineY(t, e);
  }
  updateLineColor(t, e) {
    this.internalPlotter && this.internalPlotter.updateLineColor(t, e);
  }
  updateLineTransform(t, e, i) {
    this.internalPlotter ? this.internalPlotter.updateLineTransform(t, e, i) : f.warn("updateLineTransform: plotter not initialized.");
  }
  updateLineThickness(t, e) {
    this.internalPlotter instanceof T ? this.internalPlotter.updateLineThickness(t, e) : this.internalPlotter instanceof R && (this.internalPlotter.updateLineThickness(t, 1), f.warn(
      "UnifiedLinePlot: WebglLinePlot is active, thickness forced to 1.0."
    ));
  }
  setLineEnabled(t, e) {
    this.internalPlotter && this.internalPlotter.setLineEnabled(t, e);
  }
  /**
   * Enable or disable rendering for multiple lines at once.
   * @param lineIds Array of line IDs to enable/disable
   * @param enabled True to enable rendering, false to disable
   */
  setMultipleLinesEnabled(t, e) {
    this.internalPlotter && (this.internalPlotter instanceof R ? this.internalPlotter.setMultipleLinesEnabled(t, e) : this.internalPlotter instanceof T && this.internalPlotter.setLinesEnabled(t, e));
  }
  /**
   * Update transform parameters for multiple lines at once.
   * @param lineIds Array of line IDs to update
   * @param scale Scale factors [scaleX, scaleY]
   * @param offset Offset values [offsetX, offsetY]
   */
  updateMultipleLinesTransform(t, e, i) {
    this.internalPlotter && (this.internalPlotter instanceof R ? this.internalPlotter.updateMultipleLinesTransform(t, e, i) : this.internalPlotter instanceof T && this.internalPlotter.updateLinesTransform(t, e, i));
  }
  setGlobalTransform(t, e) {
    this.internalPlotter && this.internalPlotter.setGlobalTransform(t, e);
  }
  /**
   * Auto-scale to fit all enabled lines in the current coordinate space.
   *
   * **IMPORTANT**: This method operates within the current coordinate space (linear or log)
   * and does NOT change coordinate spaces. It calculates bounds appropriate for the current
   * axis configuration and applies the transform.
   *
   * **Use autoScale() when:**
   * - Want to fit all data in the current coordinate space
   * - Need simple auto-scaling without changing coordinate spaces
   * - Don't need to preserve current zoom/pan state
   *
   * **⚠️ WARNING: Do NOT combine autoScale() with coordinate transforms!**
   * - autoScale() already works in the current coordinate space
   * - Calling transformToLogSpace() after autoScale() causes double-conversion
   *
   * **For coordinate space changes, use:**
   * - `transformToLogSpace()` - Switch to or operate in log space
   * - `transformToLinearSpace()` - Switch to or operate in linear space
   *
   * @returns DataBounds object with calculated bounds in current coordinate space, or null if no valid data
   *
   * @example
   * ```typescript
   * // ✅ CORRECT: Simple auto-scaling in current coordinate space
   * plotter.setLogAxis(false, true); // Enable log Y
   * plotter.autoScale(); // Auto-scales in log Y space - NO conversion needed!
   * 
   * // ❌ WRONG: Don't combine autoScale() with coordinate transforms
   * // const bounds = plotter.autoScale();
   * // plotter.transformToLogSpace(bounds); // This causes double-conversion!
   * 
   * // ✅ CORRECT: For coordinate space conversion, use getAllDataBounds():
   * // plotter.setLogAxis(false, true); // Enable log Y
   * // const bounds = plotter.getAllDataBounds(); // Gets linear data bounds
   * // if (bounds) plotter.transformToLogSpace(bounds); // Converts to log space
   * ```
   */
  autoScale() {
    return this.internalPlotter ? this.internalPlotter.autoScale() : null;
  }
  getLineConfig(t) {
    if (this.internalPlotter)
      return this.internalPlotter.getLineConfig(t);
  }
  /**
   * Get the data bounds of the current coordinate space (viewport) with coordinate space information.
   * This preserves the current zoom/pan when transforming to log space.
   *
   * **ENHANCED**: This method now includes coordinate space information for each axis,
   * eliminating ambiguity about whether bounds are in linear or log space.
   *
   * **Use getDataBounds() when:**
   * - You want to preserve current zoom/pan state
   * - You need to know the coordinate space of the returned bounds
   * - Followed by transformToLogSpace() which automatically handles coordinate conversion
   *
   * @returns Object with minX, maxX, minY, maxY of the current view and coordinateSpace info, or null if no valid data
   *
   * @example
   * ```typescript
   * // Enhanced API automatically handles coordinate spaces
   * const bounds = plotter.getDataBounds(); // Returns bounds with coordinate space info
   * if (bounds) {
   *   console.log(`X axis in ${bounds.coordinateSpace.x} space, Y axis in ${bounds.coordinateSpace.y} space`);
   *   plotter.transformToLogSpace(bounds); // Automatically converts coordinate spaces as needed
   * }
   *
   * // Works seamlessly in any coordinate mode - no manual conversion needed!
   * ```
   */
  getDataBounds() {
    return this.internalPlotter ? this.internalPlotter.getDataBounds() : null;
  }
  /**
   * Get the data bounds of all enabled lines (for autoscaling purposes) with coordinate space information.
   * This returns the complete extent of all data and should be used with autoScale().
   * For preserving current coordinate space, use getDataBounds() instead.
   * 
   * @returns Object with minX, maxX, minY, maxY of all the data and coordinateSpace info, or null if no valid data
   */
  getAllDataBounds() {
    return this.internalPlotter ? this.internalPlotter.getAllDataBounds() : null;
  }
  /**
   * Enable or disable logarithmic scaling for X and/or Y axes.
   *
   * **After calling setLogAxis(), you need to apply appropriate scaling:**
   * 
   * **For view preservation (recommended):**
   * 1. Get current bounds: `const bounds = plotter.getDataBounds()`
   * 2. Convert to linear space if needed: `transformBoundsToLinearSpace(bounds, oldLogX, oldLogY)`
   * 3. Apply new coordinate space: `transformToLogSpace(linearBounds)` or linear transform
   * 
   * **For simple auto-scaling:**
   * - **Enabling log axes**: Use `getAllDataBounds()` → `transformToLogSpace()`
   * - **Disabling log axes**: Use `autoScale()` (resets to linear)
   *
   * @param x Enable logarithmic base-10 scaling for X-axis
   * @param y Enable logarithmic base-10 scaling for Y-axis
   *
   * @example
   * ```typescript
   * // View preservation when toggling axes
   * const currentBounds = plotter.getDataBounds(); // Current coordinate space
   * const linearBounds = transformBoundsToLinearSpace(currentBounds, wasLogX, wasLogY);
   * plotter.setLogAxis(true, false); // Toggle to log X
   * plotter.transformToLogSpace(linearBounds); // Preserve view
   *
   * // Simple auto-scaling approach
   * plotter.setLogAxis(false, true); // Enable log Y
   * const bounds = plotter.getAllDataBounds();
   * if (bounds) plotter.transformToLogSpace(bounds);
   * ```
   */
  setLogAxis(t, e) {
    this.internalPlotter && this.internalPlotter.setLogAxis(t, e);
  }
  /**
   * Transform data bounds to logarithmic space and apply appropriate scaling.
   *
   * **ENHANCED**: This method now automatically handles coordinate space conversion.
   * It detects the coordinate space of input bounds and converts as needed.
   *
   * **Typical usage patterns:**
   * - **Any coordinate mode**: getDataBounds() → transformToLogSpace() (always works!)
   * - **Initial setup**: getAllDataBounds() → transformToLogSpace()
   * - **Zoom/pan operations**: getDataBounds() → transformToLogSpace()
   *
   * @param dataBounds Optional data bounds with coordinate space information.
   *                   If not provided, will attempt to get bounds from internal plotter.
   * @returns True if log space transformation was applied successfully,
   *          false if transformation not feasible (e.g., no positive data for log axes)
   *
   * @example
   * ```typescript
   * // Works seamlessly in any coordinate mode
   * plotter.setLogAxis(false, true); // Enable log Y
   * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
   * const success = plotter.transformToLogSpace(bounds); // Automatically handles conversion
   * if (!success) console.log("Failed to transform - check for positive data");
   *
   * // Even works when switching between coordinate spaces
   * // (bounds might be in log space, but transformToLogSpace handles this automatically)
   * const currentBounds = plotter.getDataBounds(); 
   * plotter.transformToLogSpace(currentBounds); // Always works correctly!
   * ```
   */
  transformToLogSpace(t) {
    return this.internalPlotter ? this.internalPlotter.transformToLogSpace(t) : !1;
  }
  /**
   * Transform data bounds to linear space and apply appropriate scaling.
   *
   * **ENHANCED**: This method automatically handles coordinate space conversion.
   * It detects the coordinate space of input bounds and converts as needed.
   *
   * **Typical usage patterns:**
   * - **Switching to linear axes**: `getDataBounds()` → `transformToLinearSpace()` (preserves view)
   * - **Zoom/pan in linear space**: `getDataBounds()` → `transformToLinearSpace()`
   * - **Initial linear setup**: `getAllDataBounds()` → `transformToLinearSpace()`
   *
   * @param dataBounds Optional data bounds with coordinate space information.
   *                   If not provided, will attempt to get bounds from internal plotter.
   * @returns True if linear space transformation was applied successfully,
   *          false if transformation not feasible
   *
   * @example
   * ```typescript
   * // Switching from log to linear axes while preserving view
   * const bounds = plotter.getDataBounds(); // Gets bounds with coordinate space info
   * plotter.setLogAxis(false, false); // Switch to linear axes
   * const success = plotter.transformToLinearSpace(bounds); // Preserves current view
   * 
   * // Works seamlessly from any coordinate mode
   * const currentBounds = plotter.getDataBounds(); 
   * plotter.transformToLinearSpace(currentBounds); // Always handles conversion correctly!
   * ```
   */
  transformToLinearSpace(t) {
    return this.internalPlotter ? this.internalPlotter.transformToLinearSpace(t) : !1;
  }
  /**
   * Gets the type of the currently active internal plotter.
   * @returns A string indicating the type of the internal plotter:
   * 'WebglLinePlot', 'WebglLineThick', or 'null'.
   */
  getInternalPlotterType() {
    return this.internalPlotter instanceof R ? "WebglLinePlot" : this.internalPlotter instanceof T ? "WebglLineThick" : "null";
  }
  /**
   * Get the current global transform scale values.
   * @returns [scaleX, scaleY] array or [1, 1] if no plotter is initialized
   */
  getGlobalScale() {
    return this.internalPlotter ? this.internalPlotter.getGlobalScale() : [1, 1];
  }
  /**
   * Get the current global transform offset values.
   * @returns [offsetX, offsetY] array or [0, 0] if no plotter is initialized
   */
  getGlobalOffset() {
    return this.internalPlotter ? this.internalPlotter.getGlobalOffset() : [0, 0];
  }
}
class et {
  r;
  g;
  b;
  a;
  constructor(t, e, i, o) {
    this.r = t, this.g = e, this.b = i, this.a = o;
  }
  toArray() {
    return [this.r, this.g, this.b, this.a];
  }
}
class dt {
  headIndex = 0;
  color;
  squareSize;
  maxSquare;
  gl;
  squareIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);
  colorsBuffer;
  positionBuffer;
  prog;
  attrPosLocation;
  attrColorLocation;
  constructor(t, e) {
    this.color = new et(1, 1, 1, 1), this.squareSize = 0.1, this.maxSquare = e, this.gl = t;
    const i = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!i)
      throw new Error("Unable to create vertex shader");
    this.gl.shaderSource(
      i,
      `#version 300 es

    layout(location = 1) in vec2 position;
    layout(location = 2) in vec3 sColor;
    uniform float u_size;
    uniform vec2 u_offset;
    uniform mat2 u_scale;

    out vec3 vColor;
    
    void main() {
      vColor = sColor / vec3(255.0, 255.0, 255.0);
      vec2 squareVertices[4] = vec2[4](vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(-1.0, -1.0), vec2(1.0, -1.0));
      vec2 pos = u_size * squareVertices[gl_VertexID] + position;
      gl_Position = vec4((u_scale * pos) + u_offset, 0.0, 1.0);
    }

`
    ), this.gl.compileShader(i), t.getShaderParameter(i, t.COMPILE_STATUS) || f.error(t.getShaderInfoLog(i) || "Vertex shader compilation failed");
    const o = t.createShader(t.FRAGMENT_SHADER);
    if (!o)
      throw new Error("Unable to create fragment shader");
    this.gl.shaderSource(
      o,
      `#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`
    ), this.gl.compileShader(o), t.getShaderParameter(o, t.COMPILE_STATUS) || f.error(t.getShaderInfoLog(o) || "Fragment shader compilation failed");
    const r = t.createProgram();
    this.gl.attachShader(r, i), this.gl.attachShader(r, o), this.gl.linkProgram(r), this.gl.useProgram(r), this.prog = r;
    const n = t.createBuffer();
    this.gl.bindBuffer(t.ELEMENT_ARRAY_BUFFER, n), this.gl.bufferData(t.ELEMENT_ARRAY_BUFFER, this.squareIndices, t.STATIC_DRAW);
    const s = new Float32Array(
      Array.from({ length: this.maxSquare * 2 }, () => 0)
    );
    this.positionBuffer = t.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer), this.gl.bufferData(t.ARRAY_BUFFER, s, t.DYNAMIC_DRAW), this.attrPosLocation = t.getAttribLocation(this.prog, "position"), this.gl.vertexAttribPointer(this.attrPosLocation, 2, t.FLOAT, !1, 0, 0), this.gl.vertexAttribDivisor(this.attrPosLocation, 1), this.gl.enableVertexAttribArray(this.attrPosLocation);
    const l = new Uint8Array(
      Array.from({ length: this.maxSquare * 3 }, () => 255)
    );
    this.colorsBuffer = t.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorsBuffer), this.gl.bufferData(t.ARRAY_BUFFER, l, t.DYNAMIC_DRAW), this.attrColorLocation = t.getAttribLocation(this.prog, "sColor"), this.gl.vertexAttribPointer(
      this.attrColorLocation,
      3,
      this.gl.UNSIGNED_BYTE,
      !1,
      0,
      0
    ), this.gl.vertexAttribDivisor(this.attrColorLocation, 1), this.gl.enableVertexAttribArray(this.attrColorLocation), this.setScale(1, 1), this.setOffset(0, 0);
  }
  setColor(t) {
    this.color = t;
    const e = this.gl.getUniformLocation(
      this.prog,
      "u_color"
    );
    this.gl.uniform4f(e, t.r, t.g, t.b, t.a);
  }
  setSquareSize(t) {
    this.squareSize = t;
    const e = this.gl.getUniformLocation(this.prog, "u_size");
    this.gl.uniform1f(e, this.squareSize);
  }
  setScale(t, e) {
    const i = this.gl.getUniformLocation(
      this.prog,
      "u_scale"
    );
    this.gl.uniformMatrix2fv(i, !1, [
      t,
      0,
      0,
      e
    ]);
  }
  setOffset(t, e) {
    const i = this.gl.getUniformLocation(
      this.prog,
      "u_offset"
    );
    this.gl.uniform2f(
      i,
      t,
      e
    );
  }
  addSquare(t, e) {
    this.gl.useProgram(this.prog), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer), this.gl.bufferSubData(
      this.gl.ARRAY_BUFFER,
      this.headIndex * 2 * 4,
      t,
      0,
      t.length
    ), this.gl.enableVertexAttribArray(this.attrPosLocation), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorsBuffer), this.gl.bufferSubData(
      this.gl.ARRAY_BUFFER,
      this.headIndex * 3 * 1,
      e,
      0,
      e.length
    ), this.gl.enableVertexAttribArray(this.attrColorLocation), this.headIndex = (this.headIndex + t.length / 2) % this.maxSquare;
  }
  draw() {
    this.gl.useProgram(this.prog), this.gl.drawElementsInstanced(
      this.gl.TRIANGLES,
      this.squareIndices.length,
      this.gl.UNSIGNED_SHORT,
      0,
      this.maxSquare
    );
  }
}
class gt {
  gl;
  maxSegments;
  head = 0;
  count = 0;
  positionBuffer;
  colorBuffer;
  vao;
  prog;
  uScale;
  uOffset;
  scale = [1, 1];
  offset = [0, 0];
  posScratch = new Float32Array(4);
  colorScratch = new Uint8Array(8);
  constructor(t, e) {
    this.gl = t, this.maxSegments = e;
    const i = `#version 300 es
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec4 a_color;
      uniform vec2 u_scale;
      uniform vec2 u_offset;
      out vec4 v_color;
      void main() {
        gl_Position = vec4(a_position * u_scale + u_offset, 0.0, 1.0);
        v_color = a_color;
      }`, o = `#version 300 es
      precision mediump float;
      in vec4 v_color;
      out vec4 outColor;
      void main() { outColor = v_color; }`;
    this.prog = it(t, i, o), this.uScale = t.getUniformLocation(this.prog, "u_scale"), this.uOffset = t.getUniformLocation(this.prog, "u_offset"), this.vao = t.createVertexArray(), t.bindVertexArray(this.vao), this.positionBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.positionBuffer), t.bufferData(t.ARRAY_BUFFER, e * 2 * 2 * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), this.colorBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.colorBuffer), t.bufferData(t.ARRAY_BUFFER, e * 2 * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 4, t.UNSIGNED_BYTE, !0, 0, 0), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.enable(t.BLEND), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA);
  }
  /** Map data space to clip space: clip = data * scale + offset. */
  setGlobalTransform(t, e) {
    this.scale = t, this.offset = e;
  }
  /**
   * Append a segment from (x0, y0) to (x1, y1) in data space.
   * @param color RGBA in 0..1
   */
  addSegment(t, e, i, o, r) {
    const n = this.gl;
    this.posScratch[0] = t, this.posScratch[1] = e, this.posScratch[2] = i, this.posScratch[3] = o;
    for (let s = 0; s < 2; s++)
      this.colorScratch[s * 4] = r[0] * 255, this.colorScratch[s * 4 + 1] = r[1] * 255, this.colorScratch[s * 4 + 2] = r[2] * 255, this.colorScratch[s * 4 + 3] = r[3] * 255;
    n.bindBuffer(n.ARRAY_BUFFER, this.positionBuffer), n.bufferSubData(n.ARRAY_BUFFER, this.head * 16, this.posScratch), n.bindBuffer(n.ARRAY_BUFFER, this.colorBuffer), n.bufferSubData(n.ARRAY_BUFFER, this.head * 8, this.colorScratch), n.bindBuffer(n.ARRAY_BUFFER, null), this.head = (this.head + 1) % this.maxSegments, this.count < this.maxSegments && this.count++;
  }
  /** Remove all segments (buffer contents are simply ignored). */
  clear() {
    this.head = 0, this.count = 0;
  }
  get numSegments() {
    return this.count;
  }
  draw() {
    if (this.count === 0) return;
    const t = this.gl;
    t.useProgram(this.prog), t.uniform2f(this.uScale, this.scale[0], this.scale[1]), t.uniform2f(this.uOffset, this.offset[0], this.offset[1]), t.bindVertexArray(this.vao), t.drawArrays(t.LINES, 0, this.count * 2), t.bindVertexArray(null), t.useProgram(null);
  }
  cleanup() {
    const t = this.gl;
    t.deleteBuffer(this.positionBuffer), t.deleteBuffer(this.colorBuffer), t.deleteVertexArray(this.vao), t.deleteProgram(this.prog), this.count = 0;
  }
}
function it(a, t, e) {
  const i = (s, l) => {
    const h = a.createShader(s);
    if (!h) throw new Error("Unable to create shader");
    if (a.shaderSource(h, l), a.compileShader(h), !a.getShaderParameter(h, a.COMPILE_STATUS)) {
      const d = a.getShaderInfoLog(h) || "Unknown error";
      throw a.deleteShader(h), f.error(`Shader compilation failed: ${d}`), new Error(d);
    }
    return h;
  }, o = i(a.VERTEX_SHADER, t), r = i(a.FRAGMENT_SHADER, e), n = a.createProgram();
  if (a.attachShader(n, o), a.attachShader(n, r), a.linkProgram(n), a.detachShader(n, o), a.detachShader(n, r), a.deleteShader(o), a.deleteShader(r), !a.getProgramParameter(n, a.LINK_STATUS)) {
    const s = a.getProgramInfoLog(n) || "Unknown error";
    throw a.deleteProgram(n), f.error(`Program link failed: ${s}`), new Error(s);
  }
  return n;
}
class mt {
  gl;
  maxDots;
  head = 0;
  count = 0;
  cornerBuffer;
  positionBuffer;
  radiusBuffer;
  colorBuffer;
  vao;
  prog;
  uScale;
  uOffset;
  uResolution;
  scale = [1, 1];
  offset = [0, 0];
  posScratch = new Float32Array(2);
  radiusScratch = new Float32Array(1);
  colorScratch = new Uint8Array(4);
  constructor(t, e) {
    this.gl = t, this.maxDots = e;
    const i = `#version 300 es
      layout(location = 0) in vec2 a_corner;
      layout(location = 1) in vec2 a_position;
      layout(location = 2) in float a_radius;
      layout(location = 3) in vec4 a_color;
      uniform vec2 u_scale;
      uniform vec2 u_offset;
      uniform vec2 u_resolution;
      out vec2 v_corner;
      out float v_radius;
      out vec4 v_color;
      void main() {
        vec2 center = a_position * u_scale + u_offset;
        float r = a_radius + 1.0; // 1px margin for anti-aliasing
        gl_Position = vec4(center + a_corner * r * 2.0 / u_resolution, 0.0, 1.0);
        v_corner = a_corner * r / a_radius;
        v_radius = a_radius;
        v_color = a_color;
      }`, o = `#version 300 es
      precision mediump float;
      in vec2 v_corner;
      in float v_radius;
      in vec4 v_color;
      out vec4 outColor;
      void main() {
        float d = length(v_corner);
        float aa = 1.0 / v_radius;
        float a = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, d);
        if (a <= 0.0) discard;
        outColor = vec4(v_color.rgb, v_color.a * a);
      }`;
    this.prog = it(t, i, o), this.uScale = t.getUniformLocation(this.prog, "u_scale"), this.uOffset = t.getUniformLocation(this.prog, "u_offset"), this.uResolution = t.getUniformLocation(this.prog, "u_resolution"), this.vao = t.createVertexArray(), t.bindVertexArray(this.vao), this.cornerBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.cornerBuffer), t.bufferData(t.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), t.STATIC_DRAW), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), this.positionBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.positionBuffer), t.bufferData(t.ARRAY_BUFFER, e * 2 * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 2, t.FLOAT, !1, 0, 0), t.vertexAttribDivisor(1, 1), this.radiusBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.radiusBuffer), t.bufferData(t.ARRAY_BUFFER, e * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 1, t.FLOAT, !1, 0, 0), t.vertexAttribDivisor(2, 1), this.colorBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.colorBuffer), t.bufferData(t.ARRAY_BUFFER, e * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(3), t.vertexAttribPointer(3, 4, t.UNSIGNED_BYTE, !0, 0, 0), t.vertexAttribDivisor(3, 1), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.enable(t.BLEND), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA);
  }
  /** Map data space to clip space: clip = data * scale + offset. */
  setGlobalTransform(t, e) {
    this.scale = t, this.offset = e;
  }
  /**
   * Append a dot at (x, y) in data space.
   * @param radius radius in device pixels
   * @param color RGBA in 0..1
   */
  addDot(t, e, i, o) {
    const r = this.gl;
    this.posScratch[0] = t, this.posScratch[1] = e, this.radiusScratch[0] = i, this.colorScratch[0] = o[0] * 255, this.colorScratch[1] = o[1] * 255, this.colorScratch[2] = o[2] * 255, this.colorScratch[3] = o[3] * 255, r.bindBuffer(r.ARRAY_BUFFER, this.positionBuffer), r.bufferSubData(r.ARRAY_BUFFER, this.head * 8, this.posScratch), r.bindBuffer(r.ARRAY_BUFFER, this.radiusBuffer), r.bufferSubData(r.ARRAY_BUFFER, this.head * 4, this.radiusScratch), r.bindBuffer(r.ARRAY_BUFFER, this.colorBuffer), r.bufferSubData(r.ARRAY_BUFFER, this.head * 4, this.colorScratch), r.bindBuffer(r.ARRAY_BUFFER, null), this.head = (this.head + 1) % this.maxDots, this.count < this.maxDots && this.count++;
  }
  /** Remove all dots (buffer contents are simply ignored). */
  clear() {
    this.head = 0, this.count = 0;
  }
  get numDots() {
    return this.count;
  }
  draw() {
    if (this.count === 0) return;
    const t = this.gl;
    t.useProgram(this.prog), t.uniform2f(this.uScale, this.scale[0], this.scale[1]), t.uniform2f(this.uOffset, this.offset[0], this.offset[1]), t.uniform2f(this.uResolution, t.drawingBufferWidth, t.drawingBufferHeight), t.bindVertexArray(this.vao), t.drawArraysInstanced(t.TRIANGLE_STRIP, 0, 4, this.count), t.bindVertexArray(null), t.useProgram(null);
  }
  cleanup() {
    const t = this.gl;
    t.deleteBuffer(this.cornerBuffer), t.deleteBuffer(this.positionBuffer), t.deleteBuffer(this.radiusBuffer), t.deleteBuffer(this.colorBuffer), t.deleteVertexArray(this.vao), t.deleteProgram(this.prog), this.count = 0;
  }
}
const pt = `#version 300 es
  layout(location = 0) in vec2 a_position;

  uniform vec2 u_polygon_scale;
  uniform vec2 u_polygon_offset;
  uniform vec2 u_global_scale;
  uniform vec2 u_global_offset;

  void main() {
    vec2 scaled_position = a_position * u_polygon_scale + u_polygon_offset;
    gl_Position = vec4(scaled_position * u_global_scale + u_global_offset, 0.0, 1.0);
  }
`, xt = `#version 300 es
  layout(location = 0) in vec2 a_position;
  layout(location = 1) in vec2 a_normal;
  layout(location = 2) in float a_side;

  uniform vec2 u_polygon_scale;
  uniform vec2 u_polygon_offset;
  uniform vec2 u_global_scale;
  uniform vec2 u_global_offset;
  uniform vec2 u_viewport_size;
  uniform float u_stroke_weight;

  void main() {
    vec2 scaled_position = a_position * u_polygon_scale + u_polygon_offset;
    vec2 ndc_position = scaled_position * u_global_scale + u_global_offset;
    
    vec2 pixel_to_ndc = 2.0 / u_viewport_size;
    float stroke_radius_ndc = u_stroke_weight * 0.5;
    
    vec2 offset = a_normal * pixel_to_ndc * stroke_radius_ndc * a_side;
    
    gl_Position = vec4(ndc_position + offset, 0.0, 1.0);
  }
`, q = `#version 300 es
  precision mediump float;
  uniform vec4 u_color;
  uniform float u_opacity;
  out vec4 outColor;

  void main() {
    outColor = vec4(u_color.rgb, u_color.a * u_opacity);
  }
`;
class bt {
  gl;
  prog;
  strokeProg;
  fillVAO = null;
  strokeVAO = null;
  uniformLocations;
  strokeUniformLocations;
  polygonsConfig = [];
  numPolygons = 0;
  vertexBuffer = null;
  strokeVertexBuffer = null;
  polygonStarts = [];
  polygonLengths = [];
  strokePolygonStarts = [];
  strokePolygonLengths = [];
  cachedState;
  tempArrays;
  constructor(t) {
    this.gl = t;
    const e = this.gl.getParameter(this.gl.VIEWPORT);
    if (this.cachedState = {
      viewport: e,
      globalScale: [1, 1],
      globalOffset: [0, 0],
      globalTransformDirty: !0,
      viewportDirty: !1
    }, this.tempArrays = {
      colorArray: new Float32Array(4),
      opacityArray: new Float32Array(1)
    }, this.prog = this._createShaderProgram(pt, q), this.strokeProg = this._createShaderProgram(xt, q), !this.prog)
      throw new Error("WebglPolygonPlot: Failed to create fill shader program.");
    if (!this.strokeProg)
      throw new Error("WebglPolygonPlot: Failed to create stroke shader program.");
    if (this.uniformLocations = this._getUniformLocations(this.prog), this.strokeUniformLocations = {
      ...this._getUniformLocations(this.strokeProg),
      u_viewport_size: this.gl.getUniformLocation(this.strokeProg, "u_viewport_size"),
      u_stroke_weight: this.gl.getUniformLocation(this.strokeProg, "u_stroke_weight")
    }, this.fillVAO = this.gl.createVertexArray(), this.strokeVAO = this.gl.createVertexArray(), !this.fillVAO || !this.strokeVAO)
      throw new Error("WebglPolygonPlot: Failed to create vertex array objects.");
    this.gl.enable(this.gl.BLEND), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA), this._setupViewportTracking();
  }
  initPolygons(t) {
    if (this.polygonsConfig = t.map((r) => this._normalizePolygonConfig(r)), this.numPolygons = this.polygonsConfig.length, this.vertexBuffer && (this.gl.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.strokeVertexBuffer && (this.gl.deleteBuffer(this.strokeVertexBuffer), this.strokeVertexBuffer = null), this.polygonStarts = [], this.polygonLengths = [], this.strokePolygonStarts = [], this.strokePolygonLengths = [], this.numPolygons === 0)
      return;
    let e = 0;
    for (const r of this.polygonsConfig) {
      if (r.points.length % 2 !== 0) {
        f.warn(
          "WebglPolygonPlot: Polygon points array length should be even (x,y pairs). Skipping polygon."
        );
        continue;
      }
      this.polygonStarts.push(e / 2);
      const n = r.points.length / 2;
      this.polygonLengths.push(n), e += r.points.length;
    }
    if (e === 0 && this.numPolygons > 0) {
      f.warn(
        "WebglPolygonPlot: No valid vertices found in polygon configurations."
      ), this.numPolygons = 0;
      return;
    }
    const i = new Float32Array(e);
    let o = 0;
    for (const r of this.polygonsConfig)
      r.points.length > 0 && r.points.length % 2 === 0 && (i.set(r.points, o), o += r.points.length);
    this.vertexBuffer = this.gl.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer), this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      i,
      this.gl.STATIC_DRAW
    ), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), this._generateStrokeGeometry(), this._setupFillVAO(), this.cachedState.globalTransformDirty = !0;
  }
  cleanup() {
    this.prog && (this.gl.deleteProgram(this.prog), this.prog = null), this.strokeProg && (this.gl.deleteProgram(this.strokeProg), this.strokeProg = null), this.vertexBuffer && (this.gl.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.strokeVertexBuffer && (this.gl.deleteBuffer(this.strokeVertexBuffer), this.strokeVertexBuffer = null), this.fillVAO && (this.gl.deleteVertexArray(this.fillVAO), this.fillVAO = null), this.strokeVAO && (this.gl.deleteVertexArray(this.strokeVAO), this.strokeVAO = null), this.polygonsConfig = [], this.numPolygons = 0, this.polygonStarts = [], this.polygonLengths = [], this.strokePolygonStarts = [], this.strokePolygonLengths = [];
  }
  updatePolygonPoints(t, e) {
    if (!this._validatePolygonId(t, "updatePolygonPoints") || !this.vertexBuffer)
      return;
    const i = this.polygonsConfig[t];
    if (e.length !== i.points.length) {
      f.error(
        "WebglPolygonPlot: New points array length must match the original for updatePolygonPoints. For resizing, re-initialize polygons."
      );
      return;
    }
    i.points = new Float32Array(e);
    let o = 0;
    for (let r = 0; r < t; r++)
      o += this.polygonsConfig[r].points.length * Float32Array.BYTES_PER_ELEMENT;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer), this.gl.bufferSubData(this.gl.ARRAY_BUFFER, o, i.points), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), i.isStroked && i.strokeWeight > 0 && this._regeneratePolygonStroke(t);
  }
  updatePolygonTransform(t, e, i) {
    this._validatePolygonId(t, "updatePolygonTransform") && (this.polygonsConfig[t].scale = e, this.polygonsConfig[t].offset = i);
  }
  updatePolygonStyle(t, e) {
    if (!this._validatePolygonId(t, "updatePolygonStyle")) return;
    const i = e.isStroked !== void 0 || e.strokeWeight !== void 0;
    Object.assign(this.polygonsConfig[t], e), i && (this.polygonsConfig[t].isStroked || e.isStroked) && this._regeneratePolygonStroke(t);
  }
  setPolygonEnabled(t, e) {
    this._validatePolygonId(t, "setPolygonEnabled") && (this.polygonsConfig[t].enabled = e);
  }
  setGlobalTransform(t, e) {
    (this.cachedState.globalScale[0] !== t[0] || this.cachedState.globalScale[1] !== t[1] || this.cachedState.globalOffset[0] !== e[0] || this.cachedState.globalOffset[1] !== e[1]) && (this.cachedState.globalScale = [...t], this.cachedState.globalOffset = [...e], this.cachedState.globalTransformDirty = !0);
  }
  draw() {
    if (!this.prog || !this.vertexBuffer || this.numPolygons === 0 || !this.fillVAO)
      return;
    const t = this.gl;
    this._updateViewportIfChanged(), t.useProgram(this.prog), this.cachedState.globalTransformDirty && (t.uniform2fv(this.uniformLocations.u_global_scale, this.cachedState.globalScale), t.uniform2fv(this.uniformLocations.u_global_offset, this.cachedState.globalOffset), this.cachedState.globalTransformDirty = !1), t.bindVertexArray(this.fillVAO);
    for (let e = 0; e < this.numPolygons; e++) {
      const i = this.polygonsConfig[e];
      if (!i.enabled || !i.isFilled)
        continue;
      t.uniform2fv(this.uniformLocations.u_polygon_scale, i.scale), t.uniform2fv(this.uniformLocations.u_polygon_offset, i.offset);
      const o = this.polygonStarts[e], r = this.polygonLengths[e];
      r !== 0 && (this.tempArrays.colorArray.set([i.fillColor[0], i.fillColor[1], i.fillColor[2], 1]), t.uniform4fv(this.uniformLocations.u_color, this.tempArrays.colorArray), t.uniform1f(this.uniformLocations.u_opacity, i.fillColor[3]), t.drawArrays(t.TRIANGLE_FAN, o, r));
    }
    if (t.bindVertexArray(null), this.strokeProg && this.strokeVertexBuffer && this.strokeVAO) {
      t.useProgram(this.strokeProg);
      const e = this.cachedState.viewport[2], i = this.cachedState.viewport[3];
      t.uniform2fv(this.strokeUniformLocations.u_global_scale, this.cachedState.globalScale), t.uniform2fv(this.strokeUniformLocations.u_global_offset, this.cachedState.globalOffset), t.uniform2f(this.strokeUniformLocations.u_viewport_size, e, i), t.bindVertexArray(this.strokeVAO);
      for (let o = 0; o < this.numPolygons; o++) {
        const r = this.polygonsConfig[o];
        if (!r.enabled || !r.isStroked || r.strokeWeight <= 0)
          continue;
        t.uniform2fv(this.strokeUniformLocations.u_polygon_scale, r.scale), t.uniform2fv(this.strokeUniformLocations.u_polygon_offset, r.offset), t.uniform1f(this.strokeUniformLocations.u_stroke_weight, r.strokeWeight), this.tempArrays.colorArray.set([r.strokeColor[0], r.strokeColor[1], r.strokeColor[2], 1]), t.uniform4fv(this.strokeUniformLocations.u_color, this.tempArrays.colorArray), t.uniform1f(this.strokeUniformLocations.u_opacity, r.strokeColor[3]);
        const n = this.strokePolygonStarts[o], s = this.strokePolygonLengths[o];
        s > 0 && t.drawArrays(t.TRIANGLE_STRIP, n, s);
      }
      t.bindVertexArray(null);
    }
    t.useProgram(null);
  }
  _getUniformLocations(t) {
    return {
      u_polygon_scale: this.gl.getUniformLocation(t, "u_polygon_scale"),
      u_polygon_offset: this.gl.getUniformLocation(t, "u_polygon_offset"),
      u_global_scale: this.gl.getUniformLocation(t, "u_global_scale"),
      u_global_offset: this.gl.getUniformLocation(t, "u_global_offset"),
      u_color: this.gl.getUniformLocation(t, "u_color"),
      u_opacity: this.gl.getUniformLocation(t, "u_opacity")
    };
  }
  _setupViewportTracking() {
    const t = this.gl.getParameter(this.gl.VIEWPORT);
    this.cachedState.viewport = t, this.cachedState.viewportDirty = !1;
  }
  _updateViewportIfChanged() {
    const t = this.gl.getParameter(this.gl.VIEWPORT);
    return t[2] !== this.cachedState.viewport[2] || t[3] !== this.cachedState.viewport[3] ? (this.cachedState.viewport = t, this.cachedState.viewportDirty = !0, !0) : !1;
  }
  _normalizePolygonConfig(t) {
    return {
      ...t,
      scale: t.scale || [1, 1],
      offset: t.offset || [0, 0],
      enabled: t.enabled === void 0 ? !0 : t.enabled,
      isFilled: t.isFilled === void 0 ? !0 : t.isFilled,
      isStroked: t.isStroked === void 0 ? !1 : t.isStroked,
      strokeWeight: t.strokeWeight === void 0 ? 1 : t.strokeWeight
    };
  }
  _validatePolygonId(t, e) {
    return t < 0 || t >= this.numPolygons ? (f.warn(`WebglPolygonPlot: Invalid polygonId for ${e}.`), !1) : !0;
  }
  _setupFillVAO() {
    !this.fillVAO || !this.vertexBuffer || (this.gl.bindVertexArray(this.fillVAO), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer), this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(0), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), this.gl.bindVertexArray(null));
  }
  _setupStrokeVAO() {
    if (!this.strokeVAO || !this.strokeVertexBuffer) return;
    this.gl.bindVertexArray(this.strokeVAO), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.strokeVertexBuffer);
    const t = 4, e = 5 * t;
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, !1, e, 0), this.gl.enableVertexAttribArray(0), this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, !1, e, 2 * t), this.gl.enableVertexAttribArray(1), this.gl.vertexAttribPointer(2, 1, this.gl.FLOAT, !1, e, 4 * t), this.gl.enableVertexAttribArray(2), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), this.gl.bindVertexArray(null);
  }
  _regeneratePolygonStroke(t) {
    if (t < 0 || t >= this.numPolygons) return;
    const e = this.polygonsConfig[t];
    if (!e.isStroked || e.strokeWeight <= 0) {
      this.strokePolygonLengths[t] = 0;
      return;
    }
    if (e.points.length / 2 < 3) {
      this.strokePolygonLengths[t] = 0;
      return;
    }
    this._generateStrokeGeometry();
  }
  _generateStrokeGeometry() {
    if (this.numPolygons === 0) return;
    let t = 0;
    for (let o = 0; o < this.numPolygons; o++) {
      const r = this.polygonsConfig[o];
      if (!r.isStroked || r.strokeWeight <= 0) {
        this.strokePolygonStarts.push(0), this.strokePolygonLengths.push(0);
        continue;
      }
      const n = r.points.length / 2;
      if (n < 3) {
        this.strokePolygonStarts.push(0), this.strokePolygonLengths.push(0);
        continue;
      }
      this.strokePolygonStarts.push(t);
      const s = n * 4;
      this.strokePolygonLengths.push(s), t += s;
    }
    if (t === 0) return;
    const e = new Float32Array(t * 5);
    let i = 0;
    for (let o = 0; o < this.numPolygons; o++) {
      const r = this.polygonsConfig[o];
      if (!r.isStroked || r.strokeWeight <= 0) continue;
      const n = r.points.length / 2;
      if (!(n < 3))
        for (let s = 0; s < n; s++) {
          const l = s, h = (s + 1) % n, d = r.points[l * 2], m = r.points[l * 2 + 1], A = r.points[h * 2], x = r.points[h * 2 + 1], u = A - d, c = x - m, y = Math.sqrt(u * u + c * c);
          if (y === 0) continue;
          const g = -c / y, p = u / y;
          e[i++] = d, e[i++] = m, e[i++] = g, e[i++] = p, e[i++] = -1, e[i++] = A, e[i++] = x, e[i++] = g, e[i++] = p, e[i++] = -1, e[i++] = d, e[i++] = m, e[i++] = g, e[i++] = p, e[i++] = 1, e[i++] = A, e[i++] = x, e[i++] = g, e[i++] = p, e[i++] = 1;
        }
    }
    this.strokeVertexBuffer = this.gl.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.strokeVertexBuffer), this.gl.bufferData(this.gl.ARRAY_BUFFER, e, this.gl.STATIC_DRAW), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), this._setupStrokeVAO();
  }
  _createShaderProgram(t, e) {
    const i = this.gl, o = this._compileShader(i.VERTEX_SHADER, t), r = this._compileShader(i.FRAGMENT_SHADER, e);
    if (!o || !r)
      return null;
    const n = i.createProgram();
    return n ? (i.attachShader(n, o), i.attachShader(n, r), i.linkProgram(n), i.getProgramParameter(n, i.LINK_STATUS) ? (i.deleteShader(o), i.deleteShader(r), n) : (f.error(
      `Shader program linking error: ${i.getProgramInfoLog(n) || "Unknown error"}`
    ), i.deleteProgram(n), i.deleteShader(o), i.deleteShader(r), null)) : (f.error("Failed to create shader program."), null);
  }
  _compileShader(t, e) {
    const i = this.gl, o = i.createShader(t);
    if (!o)
      return f.error("Failed to create shader."), null;
    if (i.shaderSource(o, e), i.compileShader(o), !i.getShaderParameter(o, i.COMPILE_STATUS)) {
      const r = t === i.VERTEX_SHADER ? "Vertex" : "Fragment";
      return f.error(
        `${r} shader compilation error: ${i.getShaderInfoLog(o) || "Unknown error"}`
      ), i.deleteShader(o), null;
    }
    return o;
  }
  // Helper functions to create PolygonConfig objects for basic shapes
  static createTriangle(t) {
    const {
      center: e,
      radius: i,
      rotation: o = 0,
      fillColor: r = [0.8, 0.8, 0.8, 0.5],
      strokeColor: n = [0, 0, 0, 1],
      strokeWeight: s = 1,
      isFilled: l = !0,
      isStroked: h = !1,
      scale: d,
      offset: m,
      enabled: A = !0
    } = t, x = new Float32Array(6);
    for (let u = 0; u < 3; u++) {
      const c = o + u * 2 * Math.PI / 3;
      x[u * 2] = e[0] + i * Math.cos(c), x[u * 2 + 1] = e[1] + i * Math.sin(c);
    }
    return {
      points: x,
      fillColor: r,
      strokeColor: n,
      strokeWeight: s,
      isFilled: l,
      isStroked: h,
      scale: d,
      offset: m,
      enabled: A
    };
  }
  static createSquare(t) {
    const {
      center: e,
      size: i,
      rotation: o = 0,
      fillColor: r = [0.8, 0.8, 0.8, 0.5],
      strokeColor: n = [0, 0, 0, 1],
      strokeWeight: s = 1,
      isFilled: l = !0,
      isStroked: h = !1,
      scale: d,
      offset: m,
      enabled: A = !0
    } = t, x = i / 2, u = [
      [-x, -x],
      [x, -x],
      [x, x],
      [-x, x]
    ], c = new Float32Array(8), y = Math.cos(o), g = Math.sin(o);
    for (let p = 0; p < 4; p++) {
      const [b, v] = u[p], P = b * y - v * g, S = b * g + v * y;
      c[p * 2] = e[0] + P, c[p * 2 + 1] = e[1] + S;
    }
    return {
      points: c,
      fillColor: r,
      strokeColor: n,
      strokeWeight: s,
      isFilled: l,
      isStroked: h,
      scale: d,
      offset: m,
      enabled: A
    };
  }
  static createCircle(t) {
    const {
      center: e,
      radius: i,
      segments: o = 32,
      fillColor: r = [0.8, 0.8, 0.8, 0.5],
      strokeColor: n = [0, 0, 0, 1],
      strokeWeight: s = 1,
      isFilled: l = !0,
      isStroked: h = !1,
      scale: d,
      offset: m,
      enabled: A = !0
    } = t;
    o < 3 && f.warn(
      "WebglPolygonPlot.createCircle: segments must be 3 or more. Defaulting to 3."
    );
    const x = new Float32Array(o * 2), u = 2 * Math.PI / o;
    for (let c = 0; c < o; c++) {
      const y = c * u;
      x[c * 2] = e[0] + i * Math.cos(y), x[c * 2 + 1] = e[1] + i * Math.sin(y);
    }
    return {
      points: x,
      fillColor: r,
      strokeColor: n,
      strokeWeight: s,
      isFilled: l,
      isStroked: h,
      scale: d,
      offset: m,
      enabled: A
    };
  }
}
function ot(a, t) {
  const e = t ?? (window.devicePixelRatio || 1);
  a.width = a.clientWidth * e, a.height = a.clientHeight * e;
}
function _t(a, t) {
  const e = {
    antialias: t?.antialias,
    alpha: t?.transparent ?? !1,
    desynchronized: t?.deSync,
    powerPreference: t?.powerPerformance,
    preserveDrawingBuffer: t?.preserveDrawing
  }, i = a.getContext("webgl2", e);
  if (!i)
    throw new Error("WebGL2 is not supported or context creation failed");
  return i.viewport(0, 0, a.width, a.height), i.enable(i.BLEND), i.blendFunc(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA), i;
}
function St(a) {
  const t = a.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (!t)
    throw new Error(
      `Invalid CSS color format: ${a}. Expected format: "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1`
    );
  const e = Math.max(0, Math.min(255, parseFloat(t[1]))) / 255, i = Math.max(0, Math.min(255, parseFloat(t[2]))) / 255, o = Math.max(0, Math.min(255, parseFloat(t[3]))) / 255, r = t[4] ? Math.max(0, Math.min(1, parseFloat(t[4]))) : 1;
  return [e, i, o, r];
}
function j(a, t, e, i, o) {
  let r;
  if (typeof t == "string")
    r = St(t);
  else if (Array.isArray(t))
    r = t;
  else
    throw new Error(
      "Invalid arguments. Use either CSS color string, color array, or individual RGBA values."
    );
  a.clearColor(r[0], r[1], r[2], r[3]);
}
function At(a, t) {
  a.clear(a.COLOR_BUFFER_BIT);
}
function vt(a, t) {
  a.viewport(0, 0, t.width, t.height);
}
function yt(a, t) {
  ot(a, t?.devicePixelRatio);
  const e = _t(a, t);
  return t?.backgroundColor ? j(e, t.backgroundColor) : j(e, [0, 0, 0, 1]), e;
}
function Pt(a, t, e) {
  ot(a, e), vt(t, a);
}
const Ft = ["line", "scatter", "segments", "bubble", "bar"], K = [
  [0.12, 0.47, 0.71, 1],
  [1, 0.5, 0.05, 1],
  [0.17, 0.63, 0.17, 1],
  [0.84, 0.15, 0.16, 1],
  [0.58, 0.4, 0.74, 1],
  [0.55, 0.34, 0.29, 1]
];
function Lt(a) {
  if (a instanceof HTMLCanvasElement)
    return a;
  if (typeof a == "string") {
    const e = document.getElementById(a);
    if (!(e instanceof HTMLCanvasElement))
      throw new Error(`plot: no <canvas> element found with id "${a}"`);
    return e;
  }
  const t = document.createElement("canvas");
  return t.width = 800, t.height = 600, document.body.appendChild(t), t;
}
function Z(a, t, e) {
  if (e) {
    if (e[0] === e[1])
      throw new Error(`plot: ${t}-range must span a non-zero interval`);
    return e;
  }
  let i = 1 / 0, o = -1 / 0;
  for (const r of a) {
    const n = r[t];
    for (let s = 0; s < n.length; s++) {
      const l = n[s];
      l < i && (i = l), l > o && (o = l);
    }
    if (t === "y" && r.type === "bar" && n.length > 0) {
      const s = r.baseline ?? 0;
      s < i && (i = s), s > o && (o = s);
    }
  }
  if (!isFinite(i) || !isFinite(o))
    throw new Error(`plot: cannot compute ${t}-range from empty data`);
  return i === o && (i -= 1, o += 1), [i, o];
}
function N(a, t, e) {
  if (a.x.length !== a.y.length)
    throw new Error("plot: series x and y must have the same length");
  const i = t[1] - t[0], o = e[1] - e[0], r = new Float32Array(a.x.length * 2);
  for (let n = 0; n < a.x.length; n++)
    r[n * 2] = (a.x[n] - t[0]) / i * 2 - 1, r[n * 2 + 1] = (a.y[n] - e[0]) / o * 2 - 1;
  return r;
}
function Bt(a, t, e, i) {
  const o = new ut(a, 1);
  return o.initLines([
    { points: N(t, i.x, i.y), color: e, thickness: t.thickness ?? 1, enabled: !0 }
  ]), { draw: () => o.draw(), cleanup: () => o.cleanup() };
}
function Rt(a, t, e, i, o, r) {
  const n = new dt(a, Math.max(1, e.x.length));
  n.setSquareSize(r / t.width), n.setColor(new et(1, 1, 1, 1));
  const s = new Uint8Array(e.x.length * 3);
  for (let l = 0; l < e.x.length; l++)
    s[l * 3] = Math.round(i[0] * 255), s[l * 3 + 1] = Math.round(i[1] * 255), s[l * 3 + 2] = Math.round(i[2] * 255);
  return n.addSquare(N(e, o.x, o.y), s), {
    draw: () => n.draw(),
    cleanup: () => {
    }
  };
}
function Tt(a, t, e, i) {
  if (t.x.length % 2 !== 0)
    throw new Error("plot: segments series needs an even number of points (pairs of endpoints)");
  const o = N(t, i.x, i.y), r = t.x.length / 2, n = new gt(a, Math.max(1, r));
  for (let s = 0; s < r; s++) {
    const l = t.colors?.[s] ?? e;
    n.addSegment(o[s * 4], o[s * 4 + 1], o[s * 4 + 2], o[s * 4 + 3], l);
  }
  return { draw: () => n.draw(), cleanup: () => n.cleanup() };
}
function wt(a, t, e, i, o) {
  const r = N(t, i.x, i.y), n = new mt(a, Math.max(1, t.x.length)), s = window.devicePixelRatio || 1;
  for (let l = 0; l < t.x.length; l++) {
    const h = (t.sizes?.[l] ?? o / 2) * s;
    n.addDot(r[l * 2], r[l * 2 + 1], h, t.colors?.[l] ?? e);
  }
  return { draw: () => n.draw(), cleanup: () => n.cleanup() };
}
function Et(a) {
  if (a.length < 2) return 1;
  const t = Array.from(a).sort((i, o) => i - o);
  let e = 1 / 0;
  for (let i = 1; i < t.length; i++) {
    const o = t[i] - t[i - 1];
    o > 0 && o < e && (e = o);
  }
  return isFinite(e) ? e * 0.8 : 1;
}
function Dt(a, t, e, i) {
  if (t.x.length !== t.y.length)
    throw new Error("plot: series x and y must have the same length");
  const o = (t.width ?? Et(t.x)) / 2, r = t.baseline ?? 0, n = i.x[1] - i.x[0], s = i.y[1] - i.y[0], l = (m) => (m - i.x[0]) / n * 2 - 1, h = (m) => (m - i.y[0]) / s * 2 - 1, d = new bt(a);
  return d.initPolygons(
    Array.from(t.x, (m, A) => {
      const x = l(m - o), u = l(m + o), c = h(r), y = h(t.y[A]);
      return {
        points: new Float32Array([x, c, u, c, u, y, x, y]),
        fillColor: t.colors?.[A] ?? e,
        strokeColor: [0, 0, 0, 0],
        strokeWeight: 0,
        isFilled: !0,
        isStroked: !1,
        enabled: !0
      };
    })
  ), { draw: () => d.draw(), cleanup: () => d.cleanup() };
}
function J(a, t, e) {
  const i = a.type ?? "line", o = Array.isArray(a.data) ? a.data : [a.data];
  if (o.length === 0)
    throw new Error("plot: data must contain at least one series");
  const r = o.map((h) => ({ ...h, type: h.type ?? i }));
  for (const h of r) {
    if (!Ft.includes(h.type))
      throw new Error(`plot: unsupported type "${String(h.type)}"`);
    if (h.x.length !== h.y.length)
      throw new Error("plot: series x and y must have the same length");
  }
  const n = {
    x: Z(r, "x", a["x-range"]),
    y: Z(r, "y", a["y-range"])
  }, s = a.markerSize ?? 8, l = r.map((h, d) => {
    const m = h.color ?? K[d % K.length];
    if (h.x.length === 0)
      return { draw: () => {
      }, cleanup: () => {
      } };
    switch (h.type) {
      case "scatter":
        return Rt(e, t, h, m, n, s);
      case "segments":
        return Tt(e, h, m, n);
      case "bubble":
        return wt(e, h, m, n, s);
      case "bar":
        return Dt(e, h, m, n);
      default:
        return Bt(e, h, m, n);
    }
  });
  return {
    xRange: n.x,
    yRange: n.y,
    draw: () => l.forEach((h) => h.draw()),
    cleanup: () => l.forEach((h) => h.cleanup())
  };
}
function Ut(a) {
  const t = Lt(a.canvas), e = yt(t, {
    antialias: !0,
    backgroundColor: a.backgroundColor ?? [0, 0, 0, 1]
  });
  let i = { ...a }, o = J(i, t, e);
  const r = () => {
    At(e), o.draw();
  };
  r();
  const n = (l) => {
    const h = J(l, t, e);
    o.cleanup(), i = l, o = h, s.xRange = o.xRange, s.yRange = o.yRange, r();
  }, s = {
    canvas: t,
    gl: e,
    xRange: o.xRange,
    yRange: o.yRange,
    update: (l) => n({ ...i, ...l, canvas: t }),
    redraw: r,
    resize: () => {
      Pt(t, e), n(i);
    },
    destroy: () => o.cleanup()
  };
  return s;
}
function Ot(a) {
  const t = G(null), e = G(null);
  $(() => {
    const o = t.current;
    o && (e.current ? e.current.update(a.config) : e.current = Ut({ ...a.config, canvas: o }));
  }, [a.config]), $(() => {
    const o = t.current;
    if (!a.autoResize || !o) return;
    const r = new ResizeObserver(() => e.current?.resize());
    return r.observe(o), () => r.disconnect();
  }, [a.autoResize]), $(() => () => {
    e.current?.destroy(), e.current = null;
  }, []);
  const i = a.autoResize ? { display: "block", width: "100%", height: "100%", ...a.style } : a.style;
  return st("canvas", {
    ref: t,
    width: a.autoResize ? void 0 : a.width ?? 800,
    height: a.autoResize ? void 0 : a.height ?? 600,
    style: i,
    className: a.className
  });
}
export {
  Ot as WebglPlotFigure
};
