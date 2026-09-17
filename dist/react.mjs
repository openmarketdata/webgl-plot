import { useRef as k, useEffect as H, createElement as nt } from "react";
class l {
  static debugEnabled = !1;
  /**
   * Set debug mode globally
   */
  static setDebugMode(t) {
    l.debugEnabled = t;
  }
  /**
   * Get current debug mode status
   */
  static isDebugEnabled() {
    return l.debugEnabled;
  }
  /**
   * Debug log - only shows when debug mode is enabled
   */
  static log(t) {
    l.debugEnabled && console.log(`[webglplot] ${t}`);
  }
  /**
   * Debug warn - only shows when debug mode is enabled
   */
  static warn(t) {
    l.debugEnabled && console.warn(`[webglplot] ${t}`);
  }
  /**
   * Error logging - always shows (not affected by debug flag)
   */
  static error(t) {
    console.error(`[webglplot] ${t}`);
  }
}
const z = 1e-9;
function V(r, t, e) {
  if (!t && !e) {
    const s = r.length / 2;
    return { isValid: !0, validPointCount: s, totalPoints: s, validRatio: 1 };
  }
  let i = 0;
  const n = r.length / 2;
  for (let s = 0; s < r.length; s += 2) {
    const f = r[s], d = r[s + 1], u = !t || f > 0, x = !e || d > 0;
    u && x && i++;
  }
  const o = i / n;
  return { isValid: i >= 2 && o >= 0.1, validPointCount: i, totalPoints: n, validRatio: o };
}
function J(r, t, e) {
  let i = 1 / 0, n = -1 / 0, o = 1 / 0, a = -1 / 0, s = !1;
  for (let f = 0; f < r.length; f += 2) {
    let d = r[f], u = r[f + 1];
    t && d <= 0 || e && u <= 0 || (t && d > 0 && (d = Math.log10(d)), e && u > 0 && (u = Math.log10(u)), s = !0, d < i && (i = d), d > n && (n = d), u < o && (o = u), u > a && (a = u));
  }
  return !s || !isFinite(i) || !isFinite(n) || !isFinite(o) || !isFinite(a) ? null : {
    minX: i,
    maxX: n,
    minY: o,
    maxY: a,
    coordinateSpace: {
      x: t ? "log" : "linear",
      y: e ? "log" : "linear"
    }
  };
}
function C(r) {
  const { minX: t, maxX: e, minY: i, maxY: n } = r, o = e - t, a = n - i, s = 2, f = 2;
  let d = 1, u = 1, x = 0, v = 0;
  return o > z ? (d = s / o, x = 0 - (t + o / 2) * d) : (d = 1, x = 0 - t * d), a > z ? (u = f / a, v = 0 - (i + a / 2) * u) : (u = 1, v = 0 - i * u), [d, u, x, v];
}
function Q(r, t, e) {
  const { minX: i, maxX: n, minY: o, maxY: a } = r;
  return t && (i <= 0 || n <= 0) ? (l.log("transformBoundsToLogSpace: Cannot transform X bounds - contains non-positive values"), null) : e && (o <= 0 || a <= 0) ? (l.log("transformBoundsToLogSpace: Cannot transform Y bounds - contains non-positive values"), null) : {
    minX: t ? Math.log10(i) : i,
    maxX: t ? Math.log10(n) : n,
    minY: e ? Math.log10(o) : o,
    maxY: e ? Math.log10(a) : a,
    coordinateSpace: {
      x: t ? "log" : r.coordinateSpace.x,
      y: e ? "log" : r.coordinateSpace.y
    }
  };
}
function X(r, t, e) {
  const { minX: i, maxX: n, minY: o, maxY: a } = r;
  return {
    minX: t ? Math.pow(10, i) : i,
    maxX: t ? Math.pow(10, n) : n,
    minY: e ? Math.pow(10, o) : o,
    maxY: e ? Math.pow(10, a) : a,
    coordinateSpace: {
      x: t ? "linear" : r.coordinateSpace.x,
      y: e ? "linear" : r.coordinateSpace.y
    }
  };
}
function U(r, t, e, i) {
  const [n, o] = r, [a, s] = t, f = (-1 - a) / n, d = (1 - a) / n, u = (-1 - s) / o, x = (1 - s) / o;
  return {
    minX: f,
    maxX: d,
    minY: u,
    maxY: x,
    coordinateSpace: {
      x: e ? "log" : "linear",
      y: i ? "log" : "linear"
    }
  };
}
class w {
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
      l.error("Failed to create shader program.");
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
    `, n = t.createShader(t.VERTEX_SHADER);
    if (!n)
      return l.error("Unable to create vertex shader"), null;
    if (t.shaderSource(n, e), t.compileShader(n), !t.getShaderParameter(n, t.COMPILE_STATUS))
      return l.error(
        `Error compiling vertex shader: ${t.getShaderInfoLog(n) || "Unknown error"}`
      ), t.deleteShader(n), null;
    const o = t.createShader(t.FRAGMENT_SHADER);
    if (!o)
      return l.error("Unable to create fragment shader"), t.deleteShader(n), null;
    if (t.shaderSource(o, i), t.compileShader(o), !t.getShaderParameter(o, t.COMPILE_STATUS))
      return l.error(
        `Error compiling fragment shader: ${t.getShaderInfoLog(o) || "Unknown error"}`
      ), t.deleteShader(n), t.deleteShader(o), null;
    const a = t.createProgram();
    return a ? (t.attachShader(a, n), t.attachShader(a, o), t.linkProgram(a), t.getProgramParameter(a, t.LINK_STATUS) ? (t.detachShader(a, n), t.detachShader(a, o), t.deleteShader(n), t.deleteShader(o), a) : (l.error(
      `Error linking shader program: ${t.getProgramInfoLog(a) || "Unknown error"}`
    ), t.deleteProgram(a), t.deleteShader(n), t.deleteShader(o), null)) : (l.error("Unable to create shader program"), t.deleteShader(n), t.deleteShader(o), null);
  }
  initLines(t) {
    const e = this.gl;
    if (t.length > this.maxLines ? (l.warn(
      `Number of lines (${t.length}) exceeds maxLines (${this.maxLines}). Slicing.`
    ), this.linesConfig = t.slice(0, this.maxLines).map((f) => ({ ...f }))) : this.linesConfig = t.map((f) => ({ ...f })), this.numLines = this.linesConfig.length, this.lineStarts = [], this.lineLengths = [], this.vertexBuffer && (e.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.colorBuffer && (e.deleteBuffer(this.colorBuffer), this.colorBuffer = null), this.numLines === 0)
      return;
    let i = 0;
    for (const f of this.linesConfig) {
      f.scale = f.scale || [1, 1], f.offset = f.offset || [0, 0], f.enabled === void 0 && (f.enabled = !0), f.thickness === void 0 && (f.thickness = 1);
      const d = f.points.length / 2;
      this.lineStarts.push(i), this.lineLengths.push(d), i += d;
    }
    const n = new Float32Array(i * 2), o = new Float32Array(i * 3);
    let a = 0, s = 0;
    for (let f = 0; f < this.numLines; f++) {
      const d = this.linesConfig[f];
      n.set(d.points, a);
      for (let u = 0; u < this.lineLengths[f]; u++)
        o[s++] = d.color[0], o[s++] = d.color[1], o[s++] = d.color[2];
      a += d.points.length;
    }
    this.vertexBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, n, e.STATIC_DRAW), this.colorBuffer = e.createBuffer(), e.bindBuffer(e.ARRAY_BUFFER, this.colorBuffer), e.bufferData(e.ARRAY_BUFFER, o, e.STATIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null), this.prog && this.locations.u_global_scale && this.locations.u_global_offset && (e.useProgram(this.prog), e.uniform2f(
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
      l.warn(`Invalid lineId ${t} for updateLinePoints`);
      return;
    }
    if (!this.vertexBuffer) {
      l.warn("Vertex buffer not initialized for updateLinePoints");
      return;
    }
    const i = this.linesConfig[t], n = this.lineLengths[t];
    if (e.length / 2 !== n) {
      l.warn(
        `Number of points in provided data (${e.length / 2}) does not match existing points in line ${t} (${n}). Cannot change number of points with this method.`
      );
      return;
    }
    i.points = e;
    const a = this.lineStarts[t] * 2 * Float32Array.BYTES_PER_ELEMENT, s = this.gl;
    s.bindBuffer(s.ARRAY_BUFFER, this.vertexBuffer), s.bufferSubData(s.ARRAY_BUFFER, a, e), s.bindBuffer(s.ARRAY_BUFFER, null);
  }
  updateLineY(t, e) {
    if (t < 0 || t >= this.numLines) {
      l.warn(`Invalid lineId ${t} for updateLineY`);
      return;
    }
    if (!this.vertexBuffer) {
      l.warn("Vertex buffer not initialized for updateLineY");
      return;
    }
    const i = this.linesConfig[t], n = this.lineLengths[t];
    if (e.length !== n) {
      l.warn(
        `Length of newY array (${e.length}) does not match number of points in line ${t} (${n}).`
      );
      return;
    }
    for (let f = 0; f < n; f++)
      i.points[f * 2 + 1] = e[f];
    const a = this.lineStarts[t] * 2 * Float32Array.BYTES_PER_ELEMENT, s = this.gl;
    s.bindBuffer(s.ARRAY_BUFFER, this.vertexBuffer), s.bufferSubData(s.ARRAY_BUFFER, a, i.points), s.bindBuffer(s.ARRAY_BUFFER, null);
  }
  updateLineColor(t, e) {
    if (t < 0 || t >= this.numLines) {
      l.warn(`Invalid lineId ${t} for updateLineColor`);
      return;
    }
    if (!this.colorBuffer) {
      l.warn("Color buffer not initialized for updateLineColor");
      return;
    }
    this.linesConfig[t].color = e;
    const i = this.lineStarts[t], n = this.lineLengths[t], o = new Float32Array(n * 3);
    let a = 0;
    for (let f = 0; f < n; f++)
      o[a++] = e[0], o[a++] = e[1], o[a++] = e[2];
    const s = this.gl;
    s.bindBuffer(s.ARRAY_BUFFER, this.colorBuffer), s.bufferSubData(
      s.ARRAY_BUFFER,
      i * 3 * Float32Array.BYTES_PER_ELEMENT,
      o
    ), s.bindBuffer(s.ARRAY_BUFFER, null);
  }
  updateLineTransform(t, e, i) {
    if (t < 0 || t >= this.numLines) {
      l.warn(`Invalid lineId ${t} for updateLineTransform`);
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
      l.warn(`Invalid lineId ${t} for updateLineThickness`);
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
      l.warn(`Invalid lineId ${t} for setLineEnabled`);
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
      i >= 0 && i < this.numLines ? this.linesConfig[i].enabled = e : l.warn(`Invalid lineId ${i} in setMultipleLinesEnabled`);
  }
  /**
   * Update transform parameters for multiple lines at once.
   * @param lineIds Array of line IDs to update
   * @param scale Scale factors [scaleX, scaleY]
   * @param offset Offset values [offsetX, offsetY]
   */
  updateMultipleLinesTransform(t, e, i) {
    for (const n of t)
      n >= 0 && n < this.numLines ? (this.linesConfig[n].scale = [e[0], e[1]], this.linesConfig[n].offset = [i[0], i[1]]) : l.warn(`Invalid lineId ${n} in updateMultipleLinesTransform`);
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
      return l.log("transformToLogSpace: No log axes enabled, no scaling needed"), !0;
    let e;
    t ? (e = t, l.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = U(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (this.logX && e.coordinateSpace.x === "log" || this.logY && e.coordinateSpace.y === "log") && (l.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = X(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));
    const n = Q(i, this.logX, this.logY);
    if (!n)
      return l.log("transformToLogSpace: Cannot transform bounds to log space"), !1;
    const [o, a, s, f] = C(n);
    return this.setGlobalTransform([o, a], [s, f]), l.log(`transformToLogSpace: Applied new transform - Scale[${o.toFixed(4)}, ${a.toFixed(4)}], Offset[${s.toFixed(4)}, ${f.toFixed(4)}]`), !0;
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
    t ? (e = t, l.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = U(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (e.coordinateSpace.x === "log" || e.coordinateSpace.y === "log") && (l.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = X(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)), i.coordinateSpace = {
      x: "linear",
      y: "linear"
    };
    const [n, o, a, s] = C(i);
    return this.setGlobalTransform([n, o], [a, s]), l.log(`transformToLinearSpace: Applied linear transform - Scale[${n.toFixed(4)}, ${o.toFixed(4)}], Offset[${a.toFixed(4)}, ${s.toFixed(4)}]`), !0;
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
    let t = 1 / 0, e = -1 / 0, i = 1 / 0, n = -1 / 0, o = !1;
    for (let a = 0; a < this.numLines; a++) {
      const s = this.linesConfig[a];
      if (!s.enabled || s.points.length === 0)
        continue;
      const f = s.points, d = V(f, this.logX, this.logY);
      if (!d.isValid) {
        l.log(`getAllDataBounds: Skipping line ${a} - only ${d.validPointCount}/${d.totalPoints} (${(d.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }
      o = !0;
      const u = J(f, this.logX, this.logY);
      u && (u.minX < t && (t = u.minX), u.maxX > e && (e = u.maxX), u.minY < i && (i = u.minY), u.maxY > n && (n = u.maxY));
    }
    return !o || !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(n) ? null : {
      minX: t,
      maxX: e,
      minY: i,
      maxY: n,
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
    return U(this.globalScale, this.globalOffset, this.logX, this.logY);
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
      return l.warn("No lines to auto-scale."), null;
    let t = 1 / 0, e = -1 / 0, i = 1 / 0, n = -1 / 0, o = !1;
    for (let x = 0; x < this.numLines; x++) {
      const v = this.linesConfig[x], F = v.scale, c = v.offset;
      if (!v.enabled || v.points.length === 0)
        continue;
      const h = v.points, _ = V(h, this.logX, this.logY);
      if (!_.isValid) {
        l.log(`autoScale: Skipping line ${x} - only ${_.validPointCount}/${_.totalPoints} (${(_.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }
      o = !0;
      for (let g = 0; g < h.length; g += 2) {
        let m = h[g], p = h[g + 1];
        if (this.logX)
          if (m > 0)
            m = Math.log10(m);
          else
            continue;
        if (this.logY)
          if (p > 0)
            p = Math.log10(p);
          else
            continue;
        m = m * F[0] + c[0], p = p * F[1] + c[1], m < t && (t = m), m > e && (e = m), p < i && (i = p), p > n && (n = p);
      }
    }
    if (!o || !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(n))
      return l.warn(
        "No data available for scaling or bounds are invalid. Resetting global transform."
      ), this.setGlobalTransform([1, 1], [0, 0]), null;
    const a = {
      minX: t,
      maxX: e,
      minY: i,
      maxY: n,
      coordinateSpace: {
        x: this.logX ? "log" : "linear",
        y: this.logY ? "log" : "linear"
      }
    }, [s, f, d, u] = C(a);
    return l.log(
      `AutoScale Results: Bounds [${t.toFixed(3)}, ${e.toFixed(
        3
      )}], [${i.toFixed(3)}, ${n.toFixed(
        3
      )}] -> Global Scale: [${s.toFixed(4)}, ${f.toFixed(
        4
      )}], Offset: [${d.toFixed(4)}, ${u.toFixed(4)}]`
    ), this.setGlobalTransform([s, f], [d, u]), a;
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
      l.warn(`Invalid lineId ${t} for getLineConfig`);
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
const ot = (r) => `#version 300 es
precision highp float;
precision highp int;
#define MAX_LINES ${r}

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
`, at = `#version 300 es
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
`, A = 0, B = 16, R = 32, $ = 48, b = 4, y = 4, rt = 64, st = 0.7, O = 1e-6;
function W(r, t, e) {
  const i = r.createShader(t);
  if (!i)
    throw new Error("Could not create shader object.");
  if (r.shaderSource(i, e), r.compileShader(i), !r.getShaderParameter(i, r.COMPILE_STATUS)) {
    const n = r.getShaderInfoLog(i);
    throw r.deleteShader(i), new Error(`Shader compile error: ${n}
Source:
${e}`);
  }
  return i;
}
function lt(r, t, e) {
  const i = W(r, r.VERTEX_SHADER, t), n = W(r, r.FRAGMENT_SHADER, e), o = r.createProgram();
  if (!o)
    throw r.deleteShader(i), r.deleteShader(n), new Error("Could not create program object.");
  if (r.attachShader(o, i), r.attachShader(o, n), r.linkProgram(o), r.detachShader(o, i), r.detachShader(o, n), r.deleteShader(i), r.deleteShader(n), !r.getProgramParameter(o, r.LINK_STATUS)) {
    const a = r.getProgramInfoLog(o);
    throw r.deleteProgram(o), new Error(`Program link error: ${a}`);
  }
  return o;
}
class E {
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
  lineDataStride = rt;
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
    const i = ot(this.maxLines), n = at;
    try {
      this.prog = lt(this.gl, i, n);
    } catch (f) {
      throw l.error(`Error creating main GL program: ${f}`), this.prog = null, f;
    }
    this.gl.useProgram(this.prog), this.locations = {
      uPointsTex: this.gl.getUniformLocation(this.prog, "uPointsTex"),
      uTexWidth: this.gl.getUniformLocation(this.prog, "uTexWidth"),
      uTexHeight: this.gl.getUniformLocation(this.prog, "uTexHeight"),
      uGlobalScale: this.gl.getUniformLocation(this.prog, "uGlobalScale"),
      uGlobalOffset: this.gl.getUniformLocation(this.prog, "uGlobalOffset"),
      uViewportSize: this.gl.getUniformLocation(this.prog, "uViewportSize"),
      uLogAxis: this.gl.getUniformLocation(this.prog, "uLogAxis")
    }, this.locations.uPointsTex || l.warn("Main uniform 'uPointsTex' not found."), this.locations.uTexWidth || l.warn("Main uniform 'uTexWidth' not found."), this.locations.uTexHeight || l.warn("Main uniform 'uTexHeight' not found."), this.locations.uGlobalScale || l.warn("Main uniform 'uGlobalScale' not found."), this.locations.uGlobalOffset || l.warn("Main uniform 'uGlobalOffset' not found."), this.locations.uViewportSize || l.warn("Main uniform 'uViewportSize' not found.");
    const o = "LineDataBlock", a = this.gl.getUniformBlockIndex(this.prog, o);
    if (a === this.gl.INVALID_INDEX ? l.warn(
      `Main program: Uniform block '${o}' not found or not active.`
    ) : this.gl.uniformBlockBinding(
      this.prog,
      a,
      this.lineDataUBObindingPoint
    ), this.locations.uPointsTex && this.gl.uniform1i(this.locations.uPointsTex, 0), this.lineDataUBO = this.gl.createBuffer(), !this.lineDataUBO) throw new Error("Failed to create UBO buffer.");
    if (this.pointsTexture = this.gl.createTexture(), !this.pointsTexture)
      throw new Error("Failed to create points texture.");
    if (this.vertexBuffer = this.gl.createBuffer(), !this.vertexBuffer) throw new Error("Failed to create vertex buffer.");
    if (this.vao = this.gl.createVertexArray(), !this.vao) throw new Error("Failed to create vertex array object.");
    this.gl.bindVertexArray(this.vao), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const s = 6 * b;
    this.setupVertexAttributes([
      { name: "aLineId", size: 1, offset: 0 * b },
      { name: "aIndex", size: 1, offset: 1 * b },
      { name: "aIsBevel", size: 1, offset: 2 * b },
      { name: "aBevelNormal", size: 2, offset: 3 * b },
      { name: "aSide", size: 1, offset: 5 * b }
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
      l.error("Cannot initLines, main program not initialized.");
      return;
    }
    t.length > this.maxLines && (l.warn(
      `initLines: Attempted to initialize with ${t.length} lines, but maxLines is ${this.maxLines}. Truncating.`
    ), t = t.slice(0, this.maxLines));
    const i = [];
    let n = 0;
    this.totalValidPoints = 0, this.lineOriginalNumPointsCache.fill(0), this.lineStartIndexCache.fill(0), this.lineEnabledStatus.fill(!1);
    for (let g = 0; g < t.length; g++) {
      const m = t[g], p = m.scale || [1, 1], L = m.offset || [0, 0], T = m.thickness === void 0 ? 1 : m.thickness, S = m.enabled === void 0 ? !0 : m.enabled, P = m.points.length / 2;
      if (P >= 2) {
        const D = i.length;
        i.push({
          // Store a version of the line config with defaults applied for processing
          lineObj: { ...m, scale: p, offset: L, thickness: T, enabled: S },
          startIndex: n,
          numPoints: P,
          enabled: S
          // Store initial enabled state
        }), this.lineOriginalNumPointsCache[D] = P, this.lineStartIndexCache[D] = n, this.lineEnabledStatus[D] = S, n += P, this.totalValidPoints += P;
      } else
        l.warn(
          `initLines: Skipping line index ${g} with ${P} points.`
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
      )), this.vertexBuffer && (e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, 0, e.STATIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null)), e.useProgram(this.prog), this.locations.uTexWidth && e.uniform1i(this.locations.uTexWidth, this.texWidth), this.locations.uTexHeight && e.uniform1i(this.locations.uTexHeight, this.texHeight), l.warn(
        "initLines called with no valid lines. Renderer resources cleared/reset."
      );
      return;
    }
    const o = new Float32Array(this.totalValidPoints * 2);
    let a = 0;
    for (const g of i) {
      const m = g.lineObj.points;
      o.set(m, a), a += m.length;
    }
    const s = e.getParameter(e.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(Math.max(1, this.totalValidPoints), s), this.texHeight = Math.ceil(this.totalValidPoints / this.texWidth), this.texHeight > s && (l.error("Required texture height exceeds MAX_TEXTURE_SIZE!"), this.texHeight = s);
    const f = this.texWidth * this.texHeight;
    this.pointsData.length < f * 2 ? this.pointsData = new Float32Array(f * 2) : this.pointsData.fill(0, 0, f * 2), this.pointsData.set(o), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, this.pointsTexture), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texImage2D(
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
    const d = 6, u = (g, m) => [g[0] - m[0], g[1] - m[1]], x = (g) => {
      const m = Math.sqrt(g[0] * g[0] + g[1] * g[1]);
      return m > O ? [g[0] / m, g[1] / m] : [0, 0];
    }, v = /* @__PURE__ */ new Map();
    let F = 0;
    for (let g = 0; g < this.numLines; g++) {
      const m = i[g], p = m.lineObj.points, L = m.numPoints, T = this.computeSharpTurns(g, p, L);
      v.set(g, T);
      for (let S = 0; S < L; S++)
        S > 0 && S < L - 1 && T[S] ? F += 4 : F += 2;
    }
    this.numLines > 1 && (F += (this.numLines - 1) * 4), this.totalVertexCount = F;
    const c = new Float32Array(this.totalVertexCount * d);
    let h = 0;
    for (let g = 0; g < this.numLines; g++) {
      const m = i[g], p = m.lineObj.points, L = m.numPoints, T = v.get(g) || [];
      for (let S = 0; S < L; S++)
        if (T[S]) {
          const D = [p[S * 2], p[S * 2 + 1]], et = [p[(S - 1) * 2], p[(S - 1) * 2 + 1]], it = [p[(S + 1) * 2], p[(S + 1) * 2 + 1]], M = x(u(D, et)), G = x(u(it, D)), I = [-M[1], M[0]], Y = [-G[1], G[0]];
          c[h++] = g, c[h++] = S, c[h++] = 1, c[h++] = I[0], c[h++] = I[1], c[h++] = -1, c[h++] = g, c[h++] = S, c[h++] = 1, c[h++] = I[0], c[h++] = I[1], c[h++] = 1, c[h++] = g, c[h++] = S, c[h++] = 1, c[h++] = Y[0], c[h++] = Y[1], c[h++] = -1, c[h++] = g, c[h++] = S, c[h++] = 1, c[h++] = Y[0], c[h++] = Y[1], c[h++] = 1;
        } else
          c[h++] = g, c[h++] = S, c[h++] = 0, c[h++] = 0, c[h++] = 0, c[h++] = -1, c[h++] = g, c[h++] = S, c[h++] = 0, c[h++] = 0, c[h++] = 0, c[h++] = 1;
      if (g < this.numLines - 1) {
        const S = this.lineOriginalNumPointsCache[g] - 1, P = 0;
        c[h++] = g, c[h++] = S, c[h++] = 0, c[h++] = 0, c[h++] = 0, c[h++] = 1, c[h++] = g, c[h++] = S, c[h++] = 0, c[h++] = 0, c[h++] = 0, c[h++] = 1, c[h++] = g + 1, c[h++] = P, c[h++] = 0, c[h++] = 0, c[h++] = 0, c[h++] = -1, c[h++] = g + 1, c[h++] = P, c[h++] = 0, c[h++] = 0, c[h++] = 0, c[h++] = -1;
      }
    }
    e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, c, e.STATIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null);
    const _ = this.maxLines * this.lineDataStride;
    this.lineDataArrayBuffer.byteLength !== _ ? (this.lineDataArrayBuffer = new ArrayBuffer(_), this.lineDataView = new DataView(this.lineDataArrayBuffer)) : new Float32Array(this.lineDataArrayBuffer).fill(0);
    for (let g = 0; g < this.numLines; g++) {
      const m = i[g], p = m.lineObj, L = g * this.lineDataStride;
      this.lineDataView.setFloat32(L + A + 0 * b, p.scale[0], !0), this.lineDataView.setFloat32(L + A + 1 * b, p.scale[1], !0), this.lineDataView.setFloat32(L + A + 2 * b, p.offset[0], !0), this.lineDataView.setFloat32(L + A + 3 * b, p.offset[1], !0), this.lineDataView.setFloat32(L + B + 0 * b, p.color[0], !0), this.lineDataView.setFloat32(L + B + 1 * b, p.color[1], !0), this.lineDataView.setFloat32(L + B + 2 * b, p.color[2], !0), this.lineDataView.setFloat32(L + B + 3 * b, p.color[3], !0), this.lineDataView.setInt32(L + R + 0 * y, m.startIndex, !0), this.lineDataView.setInt32(L + R + 1 * y, m.enabled ? m.numPoints : 0, !0), this.lineDataView.setInt32(L + R + 2 * y, 0, !0), this.lineDataView.setInt32(L + R + 3 * y, 0, !0), this.lineDataView.setFloat32(L + $, p.thickness, !0);
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
    return U(this.globalScale, this.globalOffset, this.logX, this.logY);
  }
  /**
   * Computes the min/max bounds of enabled lines using CPU iteration.
   * Internal method.
   * @returns DataBounds object or null if no enabled lines with points found.
   */
  _computeBoundsCPU() {
    let t = 1 / 0, e = -1 / 0, i = 1 / 0, n = -1 / 0, o = !1;
    for (let a = 0; a < this.numLines; a++)
      if (this.lineEnabledStatus[a]) {
        const s = this.lineStartIndexCache[a], f = this.lineOriginalNumPointsCache[a];
        if (f > 0) {
          const d = new Float32Array(this.pointsData.buffer, s * 8, f * 2), u = V(d, this.logX, this.logY);
          if (!u.isValid) {
            l.log(`_computeBoundsCPU: Skipping line ${a} - only ${u.validPointCount}/${u.totalPoints} (${(u.validRatio * 100).toFixed(1)}%) points valid for log axes`);
            continue;
          }
          o = !0;
          const x = J(d, this.logX, this.logY);
          x && (x.minX < t && (t = x.minX), x.maxX > e && (e = x.maxX), x.minY < i && (i = x.minY), x.maxY > n && (n = x.maxY));
        }
      }
    return o ? !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(n) ? (l.warn("_computeBoundsCPU: Resulting bounds NaN/Infinity."), null) : {
      minX: t,
      maxX: e,
      minY: i,
      maxY: n,
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
      return l.warn("autoScale: No lines initialized."), null;
    let t = null;
    if (console.time("CPU Bounds Calculation"), t = this._computeBoundsCPU(), console.timeEnd("CPU Bounds Calculation"), !t)
      return l.warn(
        "autoScale: No valid data bounds found. Setting global transform to default."
      ), this.setGlobalTransform([1, 1], [0, 0]), null;
    const { minX: e, maxX: i, minY: n, maxY: o } = t, [a, s, f, d] = C(t);
    return l.log(
      `AutoScale Results: Bounds [${e.toFixed(3)}, ${i.toFixed(
        3
      )}], [${n.toFixed(3)}, ${o.toFixed(
        3
      )}] -> Global Scale: [${a.toFixed(4)}, ${s.toFixed(
        4
      )}], Offset: [${f.toFixed(4)}, ${d.toFixed(4)}]`
    ), this.setGlobalTransform([a, s], [f, d]), t;
  }
  /**
   * Computes sharp turn detection for a line with caching and optimizations.
   * @param lineId Line identifier
   * @param pointsArray Points array for the line
   * @param numPts Number of points in the line
   * @returns Boolean array indicating sharp turns for each point
   */
  computeSharpTurns(t, e, i) {
    const n = `${i}_${e[0]}_${e[1]}_${e[i * 2 - 2]}_${e[i * 2 - 1]}`;
    if (this.sharpTurnCache.has(t) && this.pointsHashCache.get(t) === n)
      return this.sharpTurnCache.get(t);
    const o = new Array(i).fill(!1);
    if (i >= 3) {
      const a = st;
      for (let s = 1; s < i - 1; s++) {
        const f = e[(s - 1) * 2], d = e[(s - 1) * 2 + 1], u = e[s * 2], x = e[s * 2 + 1], v = e[(s + 1) * 2], F = e[(s + 1) * 2 + 1];
        let c = u - f, h = x - d, _ = v - u, g = F - x;
        const m = c * c + h * h, p = _ * _ + g * g;
        if (m < O * O || p < O * O)
          continue;
        const L = Math.sqrt(m), T = Math.sqrt(p);
        c /= L, h /= L, _ /= T, g /= T, c * _ + h * g < a && (o[s] = !0);
      }
    }
    return this.sharpTurnCache.set(t, o), this.pointsHashCache.set(t, n), o;
  }
  /**
   * Helper to setup vertex attributes with error handling.
   * @param attributes Array of attribute configurations
   * @param stride Vertex stride in bytes
   */
  setupVertexAttributes(t, e) {
    const i = this.gl;
    for (const n of t) {
      const o = i.getAttribLocation(this.prog, n.name);
      o === -1 ? l.warn(`Attribute '${n.name}' not found in main program.`) : (i.enableVertexAttribArray(o), i.vertexAttribPointer(
        o,
        n.size,
        i.FLOAT,
        !1,
        e,
        n.offset
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
      for (let n = 0; n < t.length; n++)
        i.bufferSubData(i.UNIFORM_BUFFER, t[n], e[n]);
      i.bindBuffer(i.UNIFORM_BUFFER, null);
    }
  }
  /**
   * Updates the per-line transform (scale and offset) for multiple lines using UBO updates.
   */
  updateLinesTransform(t, e, i) {
    if (!this.lineDataUBO) {
      l.warn("updateLinesTransform: UBO not available.");
      return;
    }
    const n = [], o = [];
    for (const a of t) {
      if (a < 0 || a >= this.numLines) {
        l.warn(`updateLinesTransform: Invalid lineId ${a}.`);
        continue;
      }
      const s = a * this.lineDataStride + A;
      this.lineDataView.setFloat32(s + 0 * b, e[0], !0), this.lineDataView.setFloat32(s + 1 * b, e[1], !0), this.lineDataView.setFloat32(s + 2 * b, i[0], !0), this.lineDataView.setFloat32(s + 3 * b, i[1], !0);
      const f = new Float32Array(this.lineDataArrayBuffer, s, 4);
      n.push(s), o.push(f);
    }
    n.length > 0 && this.updateUBOData(n, o);
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
      l.warn(`updateLineColor: Invalid lineId ${t}`);
      return;
    }
    if (!this.lineDataUBO) {
      l.warn("updateLineColor: UBO not available.");
      return;
    }
    const i = t * this.lineDataStride + B;
    this.lineDataView.setFloat32(i + 0 * b, e[0], !0), this.lineDataView.setFloat32(i + 1 * b, e[1], !0), this.lineDataView.setFloat32(i + 2 * b, e[2], !0), this.lineDataView.setFloat32(i + 3 * b, e[3], !0), this.reusableFloat32Array4.set(e), this.updateUBOData([i], [this.reusableFloat32Array4]);
  }
  /**
   * Updates the thickness for a specific line.
   */
  updateLineThickness(t, e) {
    if (t < 0 || t >= this.numLines) {
      l.warn(`updateLineThickness: Invalid lineId ${t}`);
      return;
    }
    if (!this.lineDataUBO) {
      l.warn("updateLineThickness: UBO not available.");
      return;
    }
    const i = t * this.lineDataStride + $;
    this.lineDataView.setFloat32(i, e, !0), this.reusableFloat32Array4[0] = e, this.updateUBOData([i], [this.reusableFloat32Array4.subarray(0, 1)]);
  }
  /**
   * Enables or disables rendering of specific lines.
   */
  setLinesEnabled(t, e) {
    if (!this.lineDataUBO) {
      l.warn("setLinesEnabled: UBO not available.");
      return;
    }
    const i = [];
    for (const n of t) {
      if (n < 0 || n >= this.numLines) {
        l.warn(`setLinesEnabled: Invalid lineId ${n}.`);
        continue;
      }
      if (this.lineEnabledStatus[n] !== e) {
        this.lineEnabledStatus[n] = e;
        const o = e ? this.lineOriginalNumPointsCache[n] : 0, a = n * this.lineDataStride + R + 1 * y;
        this.lineDataView.setInt32(a, o, !0), i.push({ byteOffset: a, numPoints: o });
      }
    }
    if (i.length > 0) {
      const n = [], o = [];
      for (const a of i)
        this.reusableInt32Array1[0] = a.numPoints, n.push(a.byteOffset), o.push(this.reusableInt32Array1.slice());
      this.updateUBOData(n, o);
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
      return l.log("transformToLogSpace: No log axes enabled, no scaling needed"), !0;
    let e;
    t ? (e = t, l.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = U(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (this.logX && e.coordinateSpace.x === "log" || this.logY && e.coordinateSpace.y === "log") && (l.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = X(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));
    const n = Q(i, this.logX, this.logY);
    if (!n)
      return l.log("transformToLogSpace: Cannot transform bounds to log space"), !1;
    const [o, a, s, f] = C(n);
    return this.setGlobalTransform([o, a], [s, f]), l.log(`transformToLogSpace: Applied new transform - Scale[${o.toFixed(4)}, ${a.toFixed(4)}], Offset[${s.toFixed(4)}, ${f.toFixed(4)}]`), !0;
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
    t ? (e = t, l.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = U(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (e.coordinateSpace.x === "log" || e.coordinateSpace.y === "log") && (l.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = X(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)), i.coordinateSpace = {
      x: "linear",
      y: "linear"
    };
    const [n, o, a, s] = C(i);
    return this.setGlobalTransform([n, o], [a, s]), l.log(`transformToLinearSpace: Applied linear transform - Scale[${n.toFixed(4)}, ${o.toFixed(4)}], Offset[${a.toFixed(4)}, ${s.toFixed(4)}]`), !0;
  }
  /**
   * Updates only the Y coordinates of the points for a given line.
   */
  updateLineY(t, e) {
    if (t < 0 || t >= this.numLines) {
      l.warn(`updateLineY: Invalid lineId ${t}`);
      return;
    }
    if (!this.pointsTexture) {
      l.warn("updateLineY: pointsTexture is null.");
      return;
    }
    const i = this.lineOriginalNumPointsCache[t];
    if (e.length !== i)
      throw new Error(
        `Line ${t}: Length mismatch for updateLineY. Expected ${i}, got ${e.length}.`
      );
    if (i <= 0) return;
    const n = this.gl, o = this.lineStartIndexCache[t];
    for (let a = 0; a < i; a++) {
      const s = (o + a) * 2 + 1;
      if (s < this.pointsData.length)
        this.pointsData[s] = e[a];
      else {
        l.error(
          `updateLineY: Index ${s} OOB length ${this.pointsData.length}.`
        );
        return;
      }
    }
    if (n.activeTexture(n.TEXTURE0), n.bindTexture(n.TEXTURE_2D, this.pointsTexture), i <= this.texWidth) {
      const a = Math.floor(o / this.texWidth), s = o % this.texWidth;
      if (s + i <= this.texWidth) {
        const f = o * 2, d = i * 2, u = new Float32Array(
          this.pointsData.buffer,
          this.pointsData.byteOffset + f * b,
          d
        );
        n.texSubImage2D(n.TEXTURE_2D, 0, s, a, i, 1, n.RG, n.FLOAT, u);
      } else
        this.updateTextureByRows(n, o, i);
    } else
      this.updateTextureByRows(n, o, i);
    n.bindTexture(n.TEXTURE_2D, null);
  }
  /**
   * Helper method to update texture data row by row.
   * @param gl WebGL context
   * @param startIdx Starting global point index
   * @param numPts Number of points to update
   */
  updateTextureByRows(t, e, i) {
    let n = e;
    const o = e + i;
    for (; n < o; ) {
      const a = Math.floor(n / this.texWidth), s = n % this.texWidth, f = this.texWidth - s, d = o - n, u = Math.min(f, d);
      if (u <= 0) break;
      const x = n * 2, v = u * 2, F = new Float32Array(
        this.pointsData.buffer,
        this.pointsData.byteOffset + x * b,
        v
      );
      t.texSubImage2D(t.TEXTURE_2D, 0, s, a, u, 1, t.RG, t.FLOAT, F), n += u;
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
    l.log("Cleaning up WebglLineThick resources..."), this.prog && (t.deleteProgram(this.prog), this.prog = null), this.pointsTexture && (t.deleteTexture(this.pointsTexture), this.pointsTexture = null), this.vertexBuffer && (t.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.lineDataUBO && (t.deleteBuffer(this.lineDataUBO), this.lineDataUBO = null), this.vao && (t.deleteVertexArray(this.vao), this.vao = null), this.pointsData = new Float32Array(0), this.lineDataArrayBuffer = new ArrayBuffer(0), this.lineDataView = new DataView(this.lineDataArrayBuffer), this.numLines = 0, this.totalVertexCount = 0, this.totalValidPoints = 0, this.lineOriginalNumPointsCache = [], this.lineStartIndexCache = [], this.lineEnabledStatus = [], this.sharpTurnCache.clear(), this.pointsHashCache.clear(), this.locations = {
      uPointsTex: null,
      uTexWidth: null,
      uTexHeight: null,
      uGlobalScale: null,
      uGlobalOffset: null,
      uViewportSize: null,
      uLogAxis: null
    }, this.globalScale = [1, 1], this.globalOffset = [0, 0], l.log("WebglLineThick resources cleaned up.");
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
      l.warn(`Invalid lineId ${t} for getLineConfig`);
      return;
    }
    if (!this.lineDataView || this.lineDataArrayBuffer.byteLength === 0) {
      l.warn("getLineConfig: Line data view or UBO not initialized.");
      return;
    }
    const e = t * this.lineDataStride;
    if (e + $ + b > this.lineDataView.byteLength) {
      l.warn(`getLineConfig: lineId ${t} results in offset out of bounds for lineDataView.`);
      return;
    }
    const i = {};
    i.scale = [
      this.lineDataView.getFloat32(e + A + 0 * b, !0),
      this.lineDataView.getFloat32(e + A + 1 * b, !0)
    ], i.offset = [
      this.lineDataView.getFloat32(e + A + 2 * b, !0),
      this.lineDataView.getFloat32(e + A + 3 * b, !0)
    ], i.color = [
      this.lineDataView.getFloat32(e + B + 0 * b, !0),
      this.lineDataView.getFloat32(e + B + 1 * b, !0),
      this.lineDataView.getFloat32(e + B + 2 * b, !0),
      this.lineDataView.getFloat32(e + B + 3 * b, !0)
    ], i.thickness = this.lineDataView.getFloat32(e + $, !0);
    const n = this.lineDataView.getInt32(e + R + 1 * y, !0);
    return i.enabled = n > 0, i;
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
class ft {
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
      this.internalPlotter instanceof w || (this.internalPlotter && this.internalPlotter.cleanup(), this.internalPlotter = new w(this.gl, this.maxLines));
      const n = t.map((o) => ({
        ...o,
        thickness: 1
        // All lines will be 1.0 for WebglLinePlot via this unified interface
      }));
      this.internalPlotter.initLines(n);
    } else
      this.internalPlotter instanceof E || (this.internalPlotter && this.internalPlotter.cleanup(), this.internalPlotter = new E(this.gl, this.maxLines)), this.internalPlotter.initLines(t);
  }
  // --- Delegated Methods ---
  draw() {
    this.internalPlotter && this.internalPlotter.draw();
  }
  cleanup() {
    this.internalPlotter && (this.internalPlotter.cleanup(), this.internalPlotter = null);
  }
  updateLinePoints(t, e) {
    this.internalPlotter instanceof w ? this.internalPlotter.updateLinePoints(t, e) : this.internalPlotter instanceof E ? l.warn(
      "updateLinePoints(xy) is not directly supported when WebglLineThick is active. Consider re-initializing the line with initLines() for full XY updates, or use updateLineY() if only Y values need changing and X values are stable."
    ) : l.warn("updateLinePoints: plotter not initialized.");
  }
  updateLineY(t, e) {
    this.internalPlotter && this.internalPlotter.updateLineY(t, e);
  }
  updateLineColor(t, e) {
    this.internalPlotter && this.internalPlotter.updateLineColor(t, e);
  }
  updateLineTransform(t, e, i) {
    this.internalPlotter ? this.internalPlotter.updateLineTransform(t, e, i) : l.warn("updateLineTransform: plotter not initialized.");
  }
  updateLineThickness(t, e) {
    this.internalPlotter instanceof E ? this.internalPlotter.updateLineThickness(t, e) : this.internalPlotter instanceof w && (this.internalPlotter.updateLineThickness(t, 1), l.warn(
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
    this.internalPlotter && (this.internalPlotter instanceof w ? this.internalPlotter.setMultipleLinesEnabled(t, e) : this.internalPlotter instanceof E && this.internalPlotter.setLinesEnabled(t, e));
  }
  /**
   * Update transform parameters for multiple lines at once.
   * @param lineIds Array of line IDs to update
   * @param scale Scale factors [scaleX, scaleY]
   * @param offset Offset values [offsetX, offsetY]
   */
  updateMultipleLinesTransform(t, e, i) {
    this.internalPlotter && (this.internalPlotter instanceof w ? this.internalPlotter.updateMultipleLinesTransform(t, e, i) : this.internalPlotter instanceof E && this.internalPlotter.updateLinesTransform(t, e, i));
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
    return this.internalPlotter instanceof w ? "WebglLinePlot" : this.internalPlotter instanceof E ? "WebglLineThick" : "null";
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
class tt {
  r;
  g;
  b;
  a;
  constructor(t, e, i, n) {
    this.r = t, this.g = e, this.b = i, this.a = n;
  }
  toArray() {
    return [this.r, this.g, this.b, this.a];
  }
}
class ht {
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
    this.color = new tt(1, 1, 1, 1), this.squareSize = 0.1, this.maxSquare = e, this.gl = t;
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
    ), this.gl.compileShader(i), t.getShaderParameter(i, t.COMPILE_STATUS) || l.error(t.getShaderInfoLog(i) || "Vertex shader compilation failed");
    const n = t.createShader(t.FRAGMENT_SHADER);
    if (!n)
      throw new Error("Unable to create fragment shader");
    this.gl.shaderSource(
      n,
      `#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`
    ), this.gl.compileShader(n), t.getShaderParameter(n, t.COMPILE_STATUS) || l.error(t.getShaderInfoLog(n) || "Fragment shader compilation failed");
    const o = t.createProgram();
    this.gl.attachShader(o, i), this.gl.attachShader(o, n), this.gl.linkProgram(o), this.gl.useProgram(o), this.prog = o;
    const a = t.createBuffer();
    this.gl.bindBuffer(t.ELEMENT_ARRAY_BUFFER, a), this.gl.bufferData(t.ELEMENT_ARRAY_BUFFER, this.squareIndices, t.STATIC_DRAW);
    const s = new Float32Array(
      Array.from({ length: this.maxSquare * 2 }, () => 0)
    );
    this.positionBuffer = t.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer), this.gl.bufferData(t.ARRAY_BUFFER, s, t.DYNAMIC_DRAW), this.attrPosLocation = t.getAttribLocation(this.prog, "position"), this.gl.vertexAttribPointer(this.attrPosLocation, 2, t.FLOAT, !1, 0, 0), this.gl.vertexAttribDivisor(this.attrPosLocation, 1), this.gl.enableVertexAttribArray(this.attrPosLocation);
    const f = new Uint8Array(
      Array.from({ length: this.maxSquare * 3 }, () => 255)
    );
    this.colorsBuffer = t.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorsBuffer), this.gl.bufferData(t.ARRAY_BUFFER, f, t.DYNAMIC_DRAW), this.attrColorLocation = t.getAttribLocation(this.prog, "sColor"), this.gl.vertexAttribPointer(
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
function ct(r, t) {
  const e = t ?? (window.devicePixelRatio || 1);
  r.width = r.clientWidth * e, r.height = r.clientHeight * e;
}
function ut(r, t) {
  const e = {
    antialias: t?.antialias,
    alpha: t?.transparent ?? !1,
    desynchronized: t?.deSync,
    powerPreference: t?.powerPerformance,
    preserveDrawingBuffer: t?.preserveDrawing
  }, i = r.getContext("webgl2", e);
  if (!i)
    throw new Error("WebGL2 is not supported or context creation failed");
  return i.viewport(0, 0, r.width, r.height), i.enable(i.BLEND), i.blendFunc(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA), i;
}
function dt(r) {
  const t = r.match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (!t)
    throw new Error(
      `Invalid CSS color format: ${r}. Expected format: "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1`
    );
  const e = Math.max(0, Math.min(255, parseFloat(t[1]))) / 255, i = Math.max(0, Math.min(255, parseFloat(t[2]))) / 255, n = Math.max(0, Math.min(255, parseFloat(t[3]))) / 255, o = t[4] ? Math.max(0, Math.min(1, parseFloat(t[4]))) : 1;
  return [e, i, n, o];
}
function q(r, t, e, i, n) {
  let o;
  if (typeof t == "string")
    o = dt(t);
  else if (Array.isArray(t))
    o = t;
  else
    throw new Error(
      "Invalid arguments. Use either CSS color string, color array, or individual RGBA values."
    );
  r.clearColor(o[0], o[1], o[2], o[3]);
}
function gt(r, t) {
  r.clear(r.COLOR_BUFFER_BIT);
}
function mt(r, t) {
  ct(r, t?.devicePixelRatio);
  const e = ut(r, t);
  return t?.backgroundColor ? q(e, t.backgroundColor) : q(e, [0, 0, 0, 1]), e;
}
const N = [
  [0.12, 0.47, 0.71, 1],
  [1, 0.5, 0.05, 1],
  [0.17, 0.63, 0.17, 1],
  [0.84, 0.15, 0.16, 1],
  [0.58, 0.4, 0.74, 1],
  [0.55, 0.34, 0.29, 1]
];
function xt(r) {
  if (r instanceof HTMLCanvasElement)
    return r;
  if (typeof r == "string") {
    const e = document.getElementById(r);
    if (!(e instanceof HTMLCanvasElement))
      throw new Error(`plot: no <canvas> element found with id "${r}"`);
    return e;
  }
  const t = document.createElement("canvas");
  return t.width = 800, t.height = 600, document.body.appendChild(t), t;
}
function j(r, t, e) {
  if (e) {
    if (e[0] === e[1])
      throw new Error(`plot: ${t}-range must span a non-zero interval`);
    return e;
  }
  let i = 1 / 0, n = -1 / 0;
  for (const o of r) {
    const a = o[t];
    for (let s = 0; s < a.length; s++) {
      const f = a[s];
      f < i && (i = f), f > n && (n = f);
    }
  }
  if (!isFinite(i) || !isFinite(n))
    throw new Error(`plot: cannot compute ${t}-range from empty data`);
  return i === n && (i -= 1, n += 1), [i, n];
}
function K(r, t, e) {
  if (r.x.length !== r.y.length)
    throw new Error("plot: series x and y must have the same length");
  const i = t[1] - t[0], n = e[1] - e[0], o = new Float32Array(r.x.length * 2);
  for (let a = 0; a < r.x.length; a++)
    o[a * 2] = (r.x[a] - t[0]) / i * 2 - 1, o[a * 2 + 1] = (r.y[a] - e[0]) / n * 2 - 1;
  return o;
}
function Z(r, t, e) {
  const i = r.type ?? "line";
  if (i !== "line" && i !== "scatter")
    throw new Error(`plot: unsupported type "${String(i)}"`);
  const n = Array.isArray(r.data) ? r.data : [r.data];
  if (n.length === 0)
    throw new Error("plot: data must contain at least one series");
  const o = j(n, "x", r["x-range"]), a = j(n, "y", r["y-range"]);
  let s, f;
  if (i === "line") {
    const d = new ft(e, n.length);
    d.initLines(
      n.map((u, x) => ({
        points: K(u, o, a),
        color: u.color ?? N[x % N.length],
        thickness: u.thickness ?? 1,
        enabled: !0
      }))
    ), s = () => d.draw(), f = () => d.cleanup();
  } else {
    const d = n.reduce((x, v) => x + v.x.length, 0), u = new ht(e, d);
    u.setSquareSize((r.markerSize ?? 8) / t.width), u.setColor(new tt(1, 1, 1, 1));
    for (let x = 0; x < n.length; x++) {
      const v = n[x], F = K(v, o, a), c = v.color ?? N[x % N.length], h = new Uint8Array(v.x.length * 3);
      for (let _ = 0; _ < v.x.length; _++)
        h[_ * 3] = Math.round(c[0] * 255), h[_ * 3 + 1] = Math.round(c[1] * 255), h[_ * 3 + 2] = Math.round(c[2] * 255);
      u.addSquare(F, h);
    }
    s = () => u.draw(), f = () => {
    };
  }
  return { xRange: o, yRange: a, draw: s, cleanup: f };
}
function pt(r) {
  const t = xt(r.canvas), e = mt(t, {
    antialias: !0,
    backgroundColor: r.backgroundColor ?? [0, 0, 0, 1]
  });
  let i = { ...r }, n = Z(i, t, e);
  const o = () => {
    gt(e), n.draw();
  };
  o();
  const a = {
    canvas: t,
    gl: e,
    xRange: n.xRange,
    yRange: n.yRange,
    update: (s) => {
      const f = { ...i, ...s, canvas: t }, d = Z(f, t, e);
      n.cleanup(), i = f, n = d, a.xRange = n.xRange, a.yRange = n.yRange, o();
    },
    redraw: o,
    destroy: () => n.cleanup()
  };
  return a;
}
function St(r) {
  const t = k(null), e = k(null);
  return H(() => {
    const i = t.current;
    i && (e.current ? e.current.update(r.config) : e.current = pt({ ...r.config, canvas: i }));
  }, [r.config]), H(() => () => {
    e.current?.destroy(), e.current = null;
  }, []), nt("canvas", {
    ref: t,
    width: r.width ?? 800,
    height: r.height ?? 600,
    style: r.style,
    className: r.className
  });
}
export {
  St as WebglPlotFigure
};
