class M {
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
class _t {
  lines;
  gl;
  coord;
  vbuffer;
  prog;
  constructor(t) {
    this.gl = t, this.lines = [];
    const e = `#version 300 es

    layout(location = 0) in vec2 coord;
    uniform mat2 uscale;
    uniform vec2 uoffset;

    void main(void) {
      vec2 line = vec2(coord.x, coord.y);
      gl_Position = vec4(uscale*line + uoffset, 0.0, 1.0);
    }`, i = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!i)
      throw new Error("Error creating vertex shader");
    this.gl.shaderSource(i, e), this.gl.compileShader(i), t.getShaderParameter(i, t.COMPILE_STATUS) || l.error(t.getShaderInfoLog(i) || "Vertex shader compilation failed");
    const o = `#version 300 es

         precision mediump float;
         uniform highp vec4 uColor;
         out vec4 outColor;
         
         void main(void) {
            outColor=  uColor;
         }`, r = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!r)
      throw new Error("Error creating fragment shader");
    this.gl.shaderSource(r, o), this.gl.compileShader(r), t.getShaderParameter(r, t.COMPILE_STATUS) || l.error(t.getShaderInfoLog(r) || "Fragment shader compilation failed"), this.prog = this.gl.createProgram(), this.gl.attachShader(this.prog, i), this.gl.attachShader(this.prog, r), this.gl.linkProgram(this.prog), this.gl.useProgram(this.prog), this.vbuffer = this.gl.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer), this.coord = this.gl.getAttribLocation(this.prog, "coord"), this.gl.vertexAttribPointer(this.coord, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.coord), this.gl.useProgram(this.prog);
    const s = t.getUniformLocation(this.prog, "uscale");
    this.gl.uniformMatrix2fv(
      s,
      !1,
      new Float32Array([1, 0, 0, 1])
    );
    const n = t.getUniformLocation(this.prog, "uoffset");
    this.gl.uniform2fv(
      n,
      new Float32Array([0, 0])
    );
    const h = t.getUniformLocation(this.prog, "uColor");
    this.gl.uniform4fv(h, [1, 1, 0, 1]);
  }
  addLine(t) {
    this.lines.push(t);
  }
  draw() {
    this.gl.useProgram(this.prog), this.lines.forEach((t) => {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbuffer), this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(t.xy),
        this.gl.STREAM_DRAW
      );
      const e = this.gl.getUniformLocation(this.prog, "uColor");
      this.gl.uniform4f(
        e,
        t.color.r,
        t.color.g,
        t.color.b,
        t.color.a
      ), this.gl.drawArrays(this.gl.LINE_STRIP, 0, t.xy.length / 2);
    });
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
    this.color = new M(1, 1, 1, 1), this.squareSize = 0.1, this.maxSquare = e, this.gl = t;
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
    ), this.gl.compileShader(o), t.getShaderParameter(o, t.COMPILE_STATUS) || l.error(t.getShaderInfoLog(o) || "Fragment shader compilation failed");
    const r = t.createProgram();
    this.gl.attachShader(r, i), this.gl.attachShader(r, o), this.gl.linkProgram(r), this.gl.useProgram(r), this.prog = r;
    const s = t.createBuffer();
    this.gl.bindBuffer(t.ELEMENT_ARRAY_BUFFER, s), this.gl.bufferData(t.ELEMENT_ARRAY_BUFFER, this.squareIndices, t.STATIC_DRAW);
    const n = new Float32Array(
      Array.from({ length: this.maxSquare * 2 }, () => 0)
    );
    this.positionBuffer = t.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer), this.gl.bufferData(t.ARRAY_BUFFER, n, t.DYNAMIC_DRAW), this.attrPosLocation = t.getAttribLocation(this.prog, "position"), this.gl.vertexAttribPointer(this.attrPosLocation, 2, t.FLOAT, !1, 0, 0), this.gl.vertexAttribDivisor(this.attrPosLocation, 1), this.gl.enableVertexAttribArray(this.attrPosLocation);
    const h = new Uint8Array(
      Array.from({ length: this.maxSquare * 3 }, () => 255)
    );
    this.colorsBuffer = t.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorsBuffer), this.gl.bufferData(t.ARRAY_BUFFER, h, t.DYNAMIC_DRAW), this.attrColorLocation = t.getAttribLocation(this.prog, "sColor"), this.gl.vertexAttribPointer(
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
class At {
  xy = [];
  color;
  constructor(t, e) {
    t === void 0 && (t = [0, 0, 1, 1]), e === void 0 && (e = new M(1, 1, 1, 1)), this.xy = t, this.color = e;
  }
  getSize() {
    return this.xy.length / 2;
  }
  setY(t) {
    for (let e = 0; e < this.xy.length; e += 2)
      this.xy[e + 1] = t;
  }
  setYs(t) {
    if (t.length == this.xy.length / 2)
      for (let e = 0; e < this.xy.length; e += 2)
        this.xy[e + 1] = t[e / 2];
    else
      throw new Error("mismatch in array length");
  }
  setXYArray(t) {
    this.xy = t;
  }
  setX(t) {
    for (let e = 0; e < this.xy.length; e += 2)
      this.xy[e] = t;
  }
  lineSpaceX(t) {
    const e = t;
    this.xy = new Array(e * 2);
    for (let i = 0; i < e; i++)
      this.xy[i * 2] = 2 * i / e - 1, this.xy[i * 2 + 1] = 0;
  }
  emptyLine(t) {
    const e = t;
    this.xy = new Array(e * 2);
    for (let i = 0; i < e; i++)
      this.xy[i * 2] = 0, this.xy[i * 2 + 1] = 0;
  }
  setColor(t) {
    this.color = t;
  }
}
class vt {
  gl;
  aPositionLocation;
  vertexBuffer;
  program;
  rollBufferSize;
  shift;
  dataIndex;
  dataX;
  lastDataX;
  lastDataY;
  numLines;
  filled;
  ext;
  colorBuffer;
  aColorLocation;
  uShiftLocation;
  uploadScratch;
  bridgeScratch;
  multiFirsts;
  multiCounts;
  constructor(t, e, i) {
    this.gl = t, this.rollBufferSize = e, this.shift = 0, this.dataIndex = 0, this.dataX = 1, this.lastDataX = Array(i).fill(0), this.lastDataY = Array(i).fill(0), this.numLines = i, this.filled = 0, this.uploadScratch = Array.from({ length: i }, () => new Float32Array(0)), this.bridgeScratch = new Float32Array(4), this.multiFirsts = new Int32Array(i * 2), this.multiCounts = new Int32Array(i * 2), this.ext = this.gl.getExtension("WEBGL_multi_draw");
    const o = `#version 300 es
        layout(location = 1) in vec2 a_position;
        layout(location = 2) in vec3 a_color;

        uniform float uShift;
        uniform vec4 uColor;

        out vec3 vColor;
    
        void main(void) {
            vec2 shiftedPosition = a_position - vec2(uShift, 0);
            gl_Position = vec4(shiftedPosition, 0, 1);

            vColor = a_color;
        }`, r = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!r)
      throw new Error("Failed to create vertex shader");
    this.gl.shaderSource(r, o), this.gl.compileShader(r), this.gl.getShaderParameter(r, this.gl.COMPILE_STATUS) || l.error(this.gl.getShaderInfoLog(r) || "Vertex shader compilation failed");
    const s = `#version 300 es
        precision mediump float;    
        in vec3 vColor;
        out vec4 outColor;
    
        void main(void) {
            outColor = vec4(vColor, 0.7);
        }`, n = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!n)
      throw new Error("Failed to create fragment shader");
    this.gl.shaderSource(n, s), this.gl.compileShader(n), this.gl.getShaderParameter(n, this.gl.COMPILE_STATUS) || l.error(this.gl.getShaderInfoLog(n) || "Fragment shader compilation failed"), this.program = this.gl.createProgram(), this.gl.attachShader(this.program, r), this.gl.attachShader(this.program, n), this.gl.linkProgram(this.program), this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS) || l.error(this.gl.getProgramInfoLog(this.program) || "Program linking failed"), this.vertexBuffer = this.gl.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer), this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array((this.rollBufferSize + 2) * 2 * i),
      this.gl.DYNAMIC_DRAW
    ), this.aPositionLocation = this.gl.getAttribLocation(this.program, "a_position"), this.gl.vertexAttribPointer(this.aPositionLocation, 2, this.gl.FLOAT, !1, 0, 0), this.gl.enableVertexAttribArray(this.aPositionLocation), this.colorBuffer = this.gl.createBuffer();
    const h = Array((this.rollBufferSize + 2) * 3 * i).fill(128);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer), this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Uint8Array(h),
      this.gl.STATIC_DRAW
    ), this.aColorLocation = this.gl.getAttribLocation(this.program, "a_color"), this.gl.vertexAttribPointer(
      this.aColorLocation,
      3,
      this.gl.UNSIGNED_BYTE,
      !0,
      0,
      0
    ), this.gl.enableVertexAttribArray(this.aColorLocation), this.uShiftLocation = this.gl.getUniformLocation(this.program, "uShift");
  }
  addPoint(t) {
    const e = this.rollBufferSize + 2;
    this.shift += 2 / this.rollBufferSize, this.dataX += 2 / this.rollBufferSize, this.gl.useProgram(this.program), this.gl.uniform1f(this.uShiftLocation, this.shift), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    for (let i = 0; i < this.numLines; i++)
      this.gl.bufferSubData(
        this.gl.ARRAY_BUFFER,
        (this.dataIndex + e * i) * 2 * 4,
        new Float32Array([this.dataX, t[i]])
      );
    if (this.gl.enableVertexAttribArray(this.aPositionLocation), this.dataIndex === this.rollBufferSize - 1)
      for (let i = 0; i < this.numLines; i++)
        this.lastDataX[i] = this.dataX, this.lastDataY[i] = t[i];
    if (this.dataIndex === 0 && this.lastDataX[0] !== 0)
      for (let i = 0; i < this.numLines; i++)
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          (this.rollBufferSize + e * i) * 2 * 4,
          new Float32Array([
            this.lastDataX[i],
            this.lastDataY[i],
            this.dataX,
            t[i]
          ])
        );
    this.dataIndex = (this.dataIndex + 1) % this.rollBufferSize, this.filled < this.rollBufferSize && this.filled++;
  }
  addPoints(t) {
    const e = this.rollBufferSize + 2;
    this.gl.useProgram(this.program), this.gl.uniform1f(this.uShiftLocation, this.shift), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    let i = this.dataX, o = this.dataIndex;
    for (let s = 0; s < t.length; s++) {
      const n = t[s], h = n.length;
      if (h === 0)
        continue;
      this.uploadScratch[s].length < h * 2 && (this.uploadScratch[s] = new Float32Array(h * 2));
      const u = this.uploadScratch[s], g = s * e, p = this.dataIndex;
      for (let x = 0; x < h; x++) {
        const d = this.dataX + x * 2 / this.rollBufferSize, m = n[x];
        u[x * 2] = d, u[x * 2 + 1] = m;
      }
      const _ = p + h;
      if (!(_ > this.rollBufferSize))
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          (p + g) * 2 * 4,
          u.subarray(0, h * 2)
        ), p === 0 && (this.lastDataX[s] !== 0 || this.lastDataY[s] !== 0) && (this.bridgeScratch[0] = this.lastDataX[s], this.bridgeScratch[1] = this.lastDataY[s], this.bridgeScratch[2] = u[0], this.bridgeScratch[3] = u[1], this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          (this.rollBufferSize + g) * 2 * 4,
          this.bridgeScratch
        ));
      else {
        const x = this.rollBufferSize - p, d = h - x;
        if (this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          (p + g) * 2 * 4,
          u.subarray(0, x * 2)
        ), this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          g * 2 * 4,
          u.subarray(x * 2, h * 2)
        ), x > 0 && d > 0) {
          const m = (x - 1) * 2, S = x * 2;
          this.bridgeScratch[0] = u[m], this.bridgeScratch[1] = u[m + 1], this.bridgeScratch[2] = u[S], this.bridgeScratch[3] = u[S + 1], this.gl.bufferSubData(
            this.gl.ARRAY_BUFFER,
            (this.rollBufferSize + g) * 2 * 4,
            this.bridgeScratch
          );
        }
      }
      const c = this.dataX + (h - 1) * 2 / this.rollBufferSize, f = n[h - 1];
      this.lastDataX[s] = c, this.lastDataY[s] = f, o = _ % this.rollBufferSize, i = c;
    }
    const r = t[0]?.length ?? 0;
    this.shift += r * (2 / this.rollBufferSize), this.dataX = i + 2 / this.rollBufferSize, this.dataIndex = o, this.filled < this.rollBufferSize && (this.filled = Math.min(this.rollBufferSize, this.filled + r)), this.gl.enableVertexAttribArray(this.aPositionLocation);
  }
  drawOld() {
    const t = this.rollBufferSize + 2;
    this.gl.useProgram(this.program);
    for (let e = 0; e < this.numLines; e++) {
      const i = e * t;
      if (this.filled < this.rollBufferSize) {
        this.filled > 1 && this.gl.drawArrays(this.gl.LINE_STRIP, i, this.filled);
        continue;
      }
      if (this.dataIndex === 0) {
        this.gl.drawArrays(this.gl.LINE_STRIP, i, this.rollBufferSize);
        continue;
      }
      const o = this.rollBufferSize - this.dataIndex + 2, r = this.dataIndex;
      this.gl.drawArrays(this.gl.LINE_STRIP, i + this.dataIndex, o), r > 0 && this.gl.drawArrays(this.gl.LINE_STRIP, i, r);
    }
  }
  drawExt() {
    const t = this.rollBufferSize + 2;
    if (this.gl.useProgram(this.program), this.filled < this.rollBufferSize) {
      for (let o = 0; o < this.numLines; o++) {
        const r = o * t;
        this.filled > 1 && this.gl.drawArrays(this.gl.LINE_STRIP, r, this.filled);
      }
      return;
    }
    const e = this.dataIndex, i = this.dataIndex === 0 ? this.rollBufferSize : this.rollBufferSize - this.dataIndex + 2;
    for (let o = 0; o < this.numLines; o++) {
      const r = o * t, s = o * 2;
      this.multiFirsts[s] = r + this.dataIndex, this.multiCounts[s] = i, this.multiFirsts[s + 1] = r, this.multiCounts[s + 1] = e;
    }
    if (!this.ext)
      throw new Error("Multi draw extension not available");
    this.ext.multiDrawArraysWEBGL(
      this.gl.LINE_STRIP,
      this.multiFirsts,
      0,
      this.multiCounts,
      0,
      this.numLines * 2
    );
  }
  draw() {
    this.ext ? this.drawExt() : this.drawOld();
  }
  setLineColor(t, e) {
    this.gl.useProgram(this.program), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    const i = [];
    for (let o = 0; o < this.rollBufferSize + 2; o++)
      i.push(t.r), i.push(t.g), i.push(t.b);
    this.gl.bufferSubData(
      this.gl.ARRAY_BUFFER,
      (this.rollBufferSize + 2) * 3 * e * 1,
      new Uint8Array(i)
    ), this.gl.enableVertexAttribArray(this.aColorLocation);
  }
}
const j = 1e-9;
function $(a, t, e) {
  if (!t && !e) {
    const n = a.length / 2;
    return { isValid: !0, validPointCount: n, totalPoints: n, validRatio: 1 };
  }
  let i = 0;
  const o = a.length / 2;
  for (let n = 0; n < a.length; n += 2) {
    const h = a[n], u = a[n + 1], g = !t || h > 0, p = !e || u > 0;
    g && p && i++;
  }
  const r = i / o;
  return { isValid: i >= 2 && r >= 0.1, validPointCount: i, totalPoints: o, validRatio: r };
}
function et(a, t, e) {
  let i = 1 / 0, o = -1 / 0, r = 1 / 0, s = -1 / 0, n = !1;
  for (let h = 0; h < a.length; h += 2) {
    let u = a[h], g = a[h + 1];
    t && u <= 0 || e && g <= 0 || (t && u > 0 && (u = Math.log10(u)), e && g > 0 && (g = Math.log10(g)), n = !0, u < i && (i = u), u > o && (o = u), g < r && (r = g), g > s && (s = g));
  }
  return !n || !isFinite(i) || !isFinite(o) || !isFinite(r) || !isFinite(s) ? null : {
    minX: i,
    maxX: o,
    minY: r,
    maxY: s,
    coordinateSpace: {
      x: t ? "log" : "linear",
      y: e ? "log" : "linear"
    }
  };
}
function U(a) {
  const { minX: t, maxX: e, minY: i, maxY: o } = a, r = e - t, s = o - i, n = 2, h = 2;
  let u = 1, g = 1, p = 0, _ = 0;
  return r > j ? (u = n / r, p = 0 - (t + r / 2) * u) : (u = 1, p = 0 - t * u), s > j ? (g = h / s, _ = 0 - (i + s / 2) * g) : (g = 1, _ = 0 - i * g), [u, g, p, _];
}
function it(a, t, e) {
  const { minX: i, maxX: o, minY: r, maxY: s } = a;
  return t && (i <= 0 || o <= 0) ? (l.log("transformBoundsToLogSpace: Cannot transform X bounds - contains non-positive values"), null) : e && (r <= 0 || s <= 0) ? (l.log("transformBoundsToLogSpace: Cannot transform Y bounds - contains non-positive values"), null) : {
    minX: t ? Math.log10(i) : i,
    maxX: t ? Math.log10(o) : o,
    minY: e ? Math.log10(r) : r,
    maxY: e ? Math.log10(s) : s,
    coordinateSpace: {
      x: t ? "log" : a.coordinateSpace.x,
      y: e ? "log" : a.coordinateSpace.y
    }
  };
}
function N(a, t, e) {
  const { minX: i, maxX: o, minY: r, maxY: s } = a;
  return {
    minX: t ? Math.pow(10, i) : i,
    maxX: t ? Math.pow(10, o) : o,
    minY: e ? Math.pow(10, r) : r,
    maxY: e ? Math.pow(10, s) : s,
    coordinateSpace: {
      x: t ? "linear" : a.coordinateSpace.x,
      y: e ? "linear" : a.coordinateSpace.y
    }
  };
}
function C(a, t, e, i) {
  const [o, r] = a, [s, n] = t, h = (-1 - s) / o, u = (1 - s) / o, g = (-1 - n) / r, p = (1 - n) / r;
  return {
    minX: h,
    maxX: u,
    minY: g,
    maxY: p,
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
    `, o = t.createShader(t.VERTEX_SHADER);
    if (!o)
      return l.error("Unable to create vertex shader"), null;
    if (t.shaderSource(o, e), t.compileShader(o), !t.getShaderParameter(o, t.COMPILE_STATUS))
      return l.error(
        `Error compiling vertex shader: ${t.getShaderInfoLog(o) || "Unknown error"}`
      ), t.deleteShader(o), null;
    const r = t.createShader(t.FRAGMENT_SHADER);
    if (!r)
      return l.error("Unable to create fragment shader"), t.deleteShader(o), null;
    if (t.shaderSource(r, i), t.compileShader(r), !t.getShaderParameter(r, t.COMPILE_STATUS))
      return l.error(
        `Error compiling fragment shader: ${t.getShaderInfoLog(r) || "Unknown error"}`
      ), t.deleteShader(o), t.deleteShader(r), null;
    const s = t.createProgram();
    return s ? (t.attachShader(s, o), t.attachShader(s, r), t.linkProgram(s), t.getProgramParameter(s, t.LINK_STATUS) ? (t.detachShader(s, o), t.detachShader(s, r), t.deleteShader(o), t.deleteShader(r), s) : (l.error(
      `Error linking shader program: ${t.getProgramInfoLog(s) || "Unknown error"}`
    ), t.deleteProgram(s), t.deleteShader(o), t.deleteShader(r), null)) : (l.error("Unable to create shader program"), t.deleteShader(o), t.deleteShader(r), null);
  }
  initLines(t) {
    const e = this.gl;
    if (t.length > this.maxLines ? (l.warn(
      `Number of lines (${t.length}) exceeds maxLines (${this.maxLines}). Slicing.`
    ), this.linesConfig = t.slice(0, this.maxLines).map((h) => ({ ...h }))) : this.linesConfig = t.map((h) => ({ ...h })), this.numLines = this.linesConfig.length, this.lineStarts = [], this.lineLengths = [], this.vertexBuffer && (e.deleteBuffer(this.vertexBuffer), this.vertexBuffer = null), this.colorBuffer && (e.deleteBuffer(this.colorBuffer), this.colorBuffer = null), this.numLines === 0)
      return;
    let i = 0;
    for (const h of this.linesConfig) {
      h.scale = h.scale || [1, 1], h.offset = h.offset || [0, 0], h.enabled === void 0 && (h.enabled = !0), h.thickness === void 0 && (h.thickness = 1);
      const u = h.points.length / 2;
      this.lineStarts.push(i), this.lineLengths.push(u), i += u;
    }
    const o = new Float32Array(i * 2), r = new Float32Array(i * 3);
    let s = 0, n = 0;
    for (let h = 0; h < this.numLines; h++) {
      const u = this.linesConfig[h];
      o.set(u.points, s);
      for (let g = 0; g < this.lineLengths[h]; g++)
        r[n++] = u.color[0], r[n++] = u.color[1], r[n++] = u.color[2];
      s += u.points.length;
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
      l.warn(`Invalid lineId ${t} for updateLinePoints`);
      return;
    }
    if (!this.vertexBuffer) {
      l.warn("Vertex buffer not initialized for updateLinePoints");
      return;
    }
    const i = this.linesConfig[t], o = this.lineLengths[t];
    if (e.length / 2 !== o) {
      l.warn(
        `Number of points in provided data (${e.length / 2}) does not match existing points in line ${t} (${o}). Cannot change number of points with this method.`
      );
      return;
    }
    i.points = e;
    const s = this.lineStarts[t] * 2 * Float32Array.BYTES_PER_ELEMENT, n = this.gl;
    n.bindBuffer(n.ARRAY_BUFFER, this.vertexBuffer), n.bufferSubData(n.ARRAY_BUFFER, s, e), n.bindBuffer(n.ARRAY_BUFFER, null);
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
    const i = this.linesConfig[t], o = this.lineLengths[t];
    if (e.length !== o) {
      l.warn(
        `Length of newY array (${e.length}) does not match number of points in line ${t} (${o}).`
      );
      return;
    }
    for (let h = 0; h < o; h++)
      i.points[h * 2 + 1] = e[h];
    const s = this.lineStarts[t] * 2 * Float32Array.BYTES_PER_ELEMENT, n = this.gl;
    n.bindBuffer(n.ARRAY_BUFFER, this.vertexBuffer), n.bufferSubData(n.ARRAY_BUFFER, s, i.points), n.bindBuffer(n.ARRAY_BUFFER, null);
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
    const i = this.lineStarts[t], o = this.lineLengths[t], r = new Float32Array(o * 3);
    let s = 0;
    for (let h = 0; h < o; h++)
      r[s++] = e[0], r[s++] = e[1], r[s++] = e[2];
    const n = this.gl;
    n.bindBuffer(n.ARRAY_BUFFER, this.colorBuffer), n.bufferSubData(
      n.ARRAY_BUFFER,
      i * 3 * Float32Array.BYTES_PER_ELEMENT,
      r
    ), n.bindBuffer(n.ARRAY_BUFFER, null);
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
    for (const o of t)
      o >= 0 && o < this.numLines ? (this.linesConfig[o].scale = [e[0], e[1]], this.linesConfig[o].offset = [i[0], i[1]]) : l.warn(`Invalid lineId ${o} in updateMultipleLinesTransform`);
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
    t ? (e = t, l.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (this.logX && e.coordinateSpace.x === "log" || this.logY && e.coordinateSpace.y === "log") && (l.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = N(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));
    const o = it(i, this.logX, this.logY);
    if (!o)
      return l.log("transformToLogSpace: Cannot transform bounds to log space"), !1;
    const [r, s, n, h] = U(o);
    return this.setGlobalTransform([r, s], [n, h]), l.log(`transformToLogSpace: Applied new transform - Scale[${r.toFixed(4)}, ${s.toFixed(4)}], Offset[${n.toFixed(4)}, ${h.toFixed(4)}]`), !0;
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
    t ? (e = t, l.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (e.coordinateSpace.x === "log" || e.coordinateSpace.y === "log") && (l.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = N(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)), i.coordinateSpace = {
      x: "linear",
      y: "linear"
    };
    const [o, r, s, n] = U(i);
    return this.setGlobalTransform([o, r], [s, n]), l.log(`transformToLinearSpace: Applied linear transform - Scale[${o.toFixed(4)}, ${r.toFixed(4)}], Offset[${s.toFixed(4)}, ${n.toFixed(4)}]`), !0;
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
    for (let s = 0; s < this.numLines; s++) {
      const n = this.linesConfig[s];
      if (!n.enabled || n.points.length === 0)
        continue;
      const h = n.points, u = $(h, this.logX, this.logY);
      if (!u.isValid) {
        l.log(`getAllDataBounds: Skipping line ${s} - only ${u.validPointCount}/${u.totalPoints} (${(u.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }
      r = !0;
      const g = et(h, this.logX, this.logY);
      g && (g.minX < t && (t = g.minX), g.maxX > e && (e = g.maxX), g.minY < i && (i = g.minY), g.maxY > o && (o = g.maxY));
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
      return l.warn("No lines to auto-scale."), null;
    let t = 1 / 0, e = -1 / 0, i = 1 / 0, o = -1 / 0, r = !1;
    for (let p = 0; p < this.numLines; p++) {
      const _ = this.linesConfig[p], b = _.scale, c = _.offset;
      if (!_.enabled || _.points.length === 0)
        continue;
      const f = _.points, x = $(f, this.logX, this.logY);
      if (!x.isValid) {
        l.log(`autoScale: Skipping line ${p} - only ${x.validPointCount}/${x.totalPoints} (${(x.validRatio * 100).toFixed(1)}%) points valid for log axes`);
        continue;
      }
      r = !0;
      for (let d = 0; d < f.length; d += 2) {
        let m = f[d], S = f[d + 1];
        if (this.logX)
          if (m > 0)
            m = Math.log10(m);
          else
            continue;
        if (this.logY)
          if (S > 0)
            S = Math.log10(S);
          else
            continue;
        m = m * b[0] + c[0], S = S * b[1] + c[1], m < t && (t = m), m > e && (e = m), S < i && (i = S), S > o && (o = S);
      }
    }
    if (!r || !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(o))
      return l.warn(
        "No data available for scaling or bounds are invalid. Resetting global transform."
      ), this.setGlobalTransform([1, 1], [0, 0]), null;
    const s = {
      minX: t,
      maxX: e,
      minY: i,
      maxY: o,
      coordinateSpace: {
        x: this.logX ? "log" : "linear",
        y: this.logY ? "log" : "linear"
      }
    }, [n, h, u, g] = U(s);
    return l.log(
      `AutoScale Results: Bounds [${t.toFixed(3)}, ${e.toFixed(
        3
      )}], [${i.toFixed(3)}, ${o.toFixed(
        3
      )}] -> Global Scale: [${n.toFixed(4)}, ${h.toFixed(
        4
      )}], Offset: [${u.toFixed(4)}, ${g.toFixed(4)}]`
    ), this.setGlobalTransform([n, h], [u, g]), s;
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
const ft = (a) => `#version 300 es
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
`, ct = `#version 300 es
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
`, L = 0, B = 16, w = 32, V = 48, A = 4, D = 4, ut = 64, gt = 0.7, O = 1e-6;
function K(a, t, e) {
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
function dt(a, t, e) {
  const i = K(a, a.VERTEX_SHADER, t), o = K(a, a.FRAGMENT_SHADER, e), r = a.createProgram();
  if (!r)
    throw a.deleteShader(i), a.deleteShader(o), new Error("Could not create program object.");
  if (a.attachShader(r, i), a.attachShader(r, o), a.linkProgram(r), a.detachShader(r, i), a.detachShader(r, o), a.deleteShader(i), a.deleteShader(o), !a.getProgramParameter(r, a.LINK_STATUS)) {
    const s = a.getProgramInfoLog(r);
    throw a.deleteProgram(r), new Error(`Program link error: ${s}`);
  }
  return r;
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
  lineDataStride = ut;
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
    const i = ft(this.maxLines), o = ct;
    try {
      this.prog = dt(this.gl, i, o);
    } catch (h) {
      throw l.error(`Error creating main GL program: ${h}`), this.prog = null, h;
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
    const r = "LineDataBlock", s = this.gl.getUniformBlockIndex(this.prog, r);
    if (s === this.gl.INVALID_INDEX ? l.warn(
      `Main program: Uniform block '${r}' not found or not active.`
    ) : this.gl.uniformBlockBinding(
      this.prog,
      s,
      this.lineDataUBObindingPoint
    ), this.locations.uPointsTex && this.gl.uniform1i(this.locations.uPointsTex, 0), this.lineDataUBO = this.gl.createBuffer(), !this.lineDataUBO) throw new Error("Failed to create UBO buffer.");
    if (this.pointsTexture = this.gl.createTexture(), !this.pointsTexture)
      throw new Error("Failed to create points texture.");
    if (this.vertexBuffer = this.gl.createBuffer(), !this.vertexBuffer) throw new Error("Failed to create vertex buffer.");
    if (this.vao = this.gl.createVertexArray(), !this.vao) throw new Error("Failed to create vertex array object.");
    this.gl.bindVertexArray(this.vao), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const n = 6 * A;
    this.setupVertexAttributes([
      { name: "aLineId", size: 1, offset: 0 * A },
      { name: "aIndex", size: 1, offset: 1 * A },
      { name: "aIsBevel", size: 1, offset: 2 * A },
      { name: "aBevelNormal", size: 2, offset: 3 * A },
      { name: "aSide", size: 1, offset: 5 * A }
    ], n), this.gl.bindVertexArray(null), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), this.lineEnabledStatus = new Array(this.maxLines).fill(!1), this.lineOriginalNumPointsCache = new Array(this.maxLines).fill(0), this.lineStartIndexCache = new Array(this.maxLines).fill(0), this.setGlobalTransform(this.globalScale, this.globalOffset), this.gl.useProgram(null), this.gl.enable(this.gl.BLEND), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
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
    let o = 0;
    this.totalValidPoints = 0, this.lineOriginalNumPointsCache.fill(0), this.lineStartIndexCache.fill(0), this.lineEnabledStatus.fill(!1);
    for (let d = 0; d < t.length; d++) {
      const m = t[d], S = m.scale || [1, 1], P = m.offset || [0, 0], F = m.thickness === void 0 ? 1 : m.thickness, v = m.enabled === void 0 ? !0 : m.enabled, y = m.points.length / 2;
      if (y >= 2) {
        const T = i.length;
        i.push({
          // Store a version of the line config with defaults applied for processing
          lineObj: { ...m, scale: S, offset: P, thickness: F, enabled: v },
          startIndex: o,
          numPoints: y,
          enabled: v
          // Store initial enabled state
        }), this.lineOriginalNumPointsCache[T] = y, this.lineStartIndexCache[T] = o, this.lineEnabledStatus[T] = v, o += y, this.totalValidPoints += y;
      } else
        l.warn(
          `initLines: Skipping line index ${d} with ${y} points.`
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
      const d = this.maxLines * this.lineDataStride;
      this.lineDataArrayBuffer.byteLength !== d ? (this.lineDataArrayBuffer = new ArrayBuffer(d), this.lineDataView = new DataView(this.lineDataArrayBuffer)) : new Float32Array(this.lineDataArrayBuffer).fill(0), this.lineDataUBO && (e.bindBuffer(e.UNIFORM_BUFFER, this.lineDataUBO), e.bufferData(
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
    const r = new Float32Array(this.totalValidPoints * 2);
    let s = 0;
    for (const d of i) {
      const m = d.lineObj.points;
      r.set(m, s), s += m.length;
    }
    const n = e.getParameter(e.MAX_TEXTURE_SIZE);
    this.texWidth = Math.min(Math.max(1, this.totalValidPoints), n), this.texHeight = Math.ceil(this.totalValidPoints / this.texWidth), this.texHeight > n && (l.error("Required texture height exceeds MAX_TEXTURE_SIZE!"), this.texHeight = n);
    const h = this.texWidth * this.texHeight;
    this.pointsData.length < h * 2 ? this.pointsData = new Float32Array(h * 2) : this.pointsData.fill(0, 0, h * 2), this.pointsData.set(r), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, this.pointsTexture), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST), e.texImage2D(
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
    const u = 6, g = (d, m) => [d[0] - m[0], d[1] - m[1]], p = (d) => {
      const m = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
      return m > O ? [d[0] / m, d[1] / m] : [0, 0];
    }, _ = /* @__PURE__ */ new Map();
    let b = 0;
    for (let d = 0; d < this.numLines; d++) {
      const m = i[d], S = m.lineObj.points, P = m.numPoints, F = this.computeSharpTurns(d, S, P);
      _.set(d, F);
      for (let v = 0; v < P; v++)
        v > 0 && v < P - 1 && F[v] ? b += 4 : b += 2;
    }
    this.numLines > 1 && (b += (this.numLines - 1) * 4), this.totalVertexCount = b;
    const c = new Float32Array(this.totalVertexCount * u);
    let f = 0;
    for (let d = 0; d < this.numLines; d++) {
      const m = i[d], S = m.lineObj.points, P = m.numPoints, F = _.get(d) || [];
      for (let v = 0; v < P; v++)
        if (F[v]) {
          const T = [S[v * 2], S[v * 2 + 1]], at = [S[(v - 1) * 2], S[(v - 1) * 2 + 1]], lt = [S[(v + 1) * 2], S[(v + 1) * 2 + 1]], H = p(g(T, at)), q = p(g(lt, T)), I = [-H[1], H[0]], Y = [-q[1], q[0]];
          c[f++] = d, c[f++] = v, c[f++] = 1, c[f++] = I[0], c[f++] = I[1], c[f++] = -1, c[f++] = d, c[f++] = v, c[f++] = 1, c[f++] = I[0], c[f++] = I[1], c[f++] = 1, c[f++] = d, c[f++] = v, c[f++] = 1, c[f++] = Y[0], c[f++] = Y[1], c[f++] = -1, c[f++] = d, c[f++] = v, c[f++] = 1, c[f++] = Y[0], c[f++] = Y[1], c[f++] = 1;
        } else
          c[f++] = d, c[f++] = v, c[f++] = 0, c[f++] = 0, c[f++] = 0, c[f++] = -1, c[f++] = d, c[f++] = v, c[f++] = 0, c[f++] = 0, c[f++] = 0, c[f++] = 1;
      if (d < this.numLines - 1) {
        const v = this.lineOriginalNumPointsCache[d] - 1, y = 0;
        c[f++] = d, c[f++] = v, c[f++] = 0, c[f++] = 0, c[f++] = 0, c[f++] = 1, c[f++] = d, c[f++] = v, c[f++] = 0, c[f++] = 0, c[f++] = 0, c[f++] = 1, c[f++] = d + 1, c[f++] = y, c[f++] = 0, c[f++] = 0, c[f++] = 0, c[f++] = -1, c[f++] = d + 1, c[f++] = y, c[f++] = 0, c[f++] = 0, c[f++] = 0, c[f++] = -1;
      }
    }
    e.bindBuffer(e.ARRAY_BUFFER, this.vertexBuffer), e.bufferData(e.ARRAY_BUFFER, c, e.STATIC_DRAW), e.bindBuffer(e.ARRAY_BUFFER, null);
    const x = this.maxLines * this.lineDataStride;
    this.lineDataArrayBuffer.byteLength !== x ? (this.lineDataArrayBuffer = new ArrayBuffer(x), this.lineDataView = new DataView(this.lineDataArrayBuffer)) : new Float32Array(this.lineDataArrayBuffer).fill(0);
    for (let d = 0; d < this.numLines; d++) {
      const m = i[d], S = m.lineObj, P = d * this.lineDataStride;
      this.lineDataView.setFloat32(P + L + 0 * A, S.scale[0], !0), this.lineDataView.setFloat32(P + L + 1 * A, S.scale[1], !0), this.lineDataView.setFloat32(P + L + 2 * A, S.offset[0], !0), this.lineDataView.setFloat32(P + L + 3 * A, S.offset[1], !0), this.lineDataView.setFloat32(P + B + 0 * A, S.color[0], !0), this.lineDataView.setFloat32(P + B + 1 * A, S.color[1], !0), this.lineDataView.setFloat32(P + B + 2 * A, S.color[2], !0), this.lineDataView.setFloat32(P + B + 3 * A, S.color[3], !0), this.lineDataView.setInt32(P + w + 0 * D, m.startIndex, !0), this.lineDataView.setInt32(P + w + 1 * D, m.enabled ? m.numPoints : 0, !0), this.lineDataView.setInt32(P + w + 2 * D, 0, !0), this.lineDataView.setInt32(P + w + 3 * D, 0, !0), this.lineDataView.setFloat32(P + V, S.thickness, !0);
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
    for (let s = 0; s < this.numLines; s++)
      if (this.lineEnabledStatus[s]) {
        const n = this.lineStartIndexCache[s], h = this.lineOriginalNumPointsCache[s];
        if (h > 0) {
          const u = new Float32Array(this.pointsData.buffer, n * 8, h * 2), g = $(u, this.logX, this.logY);
          if (!g.isValid) {
            l.log(`_computeBoundsCPU: Skipping line ${s} - only ${g.validPointCount}/${g.totalPoints} (${(g.validRatio * 100).toFixed(1)}%) points valid for log axes`);
            continue;
          }
          r = !0;
          const p = et(u, this.logX, this.logY);
          p && (p.minX < t && (t = p.minX), p.maxX > e && (e = p.maxX), p.minY < i && (i = p.minY), p.maxY > o && (o = p.maxY));
        }
      }
    return r ? !isFinite(t) || !isFinite(e) || !isFinite(i) || !isFinite(o) ? (l.warn("_computeBoundsCPU: Resulting bounds NaN/Infinity."), null) : {
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
      return l.warn("autoScale: No lines initialized."), null;
    let t = null;
    if (console.time("CPU Bounds Calculation"), t = this._computeBoundsCPU(), console.timeEnd("CPU Bounds Calculation"), !t)
      return l.warn(
        "autoScale: No valid data bounds found. Setting global transform to default."
      ), this.setGlobalTransform([1, 1], [0, 0]), null;
    const { minX: e, maxX: i, minY: o, maxY: r } = t, [s, n, h, u] = U(t);
    return l.log(
      `AutoScale Results: Bounds [${e.toFixed(3)}, ${i.toFixed(
        3
      )}], [${o.toFixed(3)}, ${r.toFixed(
        3
      )}] -> Global Scale: [${s.toFixed(4)}, ${n.toFixed(
        4
      )}], Offset: [${h.toFixed(4)}, ${u.toFixed(4)}]`
    ), this.setGlobalTransform([s, n], [h, u]), t;
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
      const s = gt;
      for (let n = 1; n < i - 1; n++) {
        const h = e[(n - 1) * 2], u = e[(n - 1) * 2 + 1], g = e[n * 2], p = e[n * 2 + 1], _ = e[(n + 1) * 2], b = e[(n + 1) * 2 + 1];
        let c = g - h, f = p - u, x = _ - g, d = b - p;
        const m = c * c + f * f, S = x * x + d * d;
        if (m < O * O || S < O * O)
          continue;
        const P = Math.sqrt(m), F = Math.sqrt(S);
        c /= P, f /= P, x /= F, d /= F, c * x + f * d < s && (r[n] = !0);
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
      r === -1 ? l.warn(`Attribute '${o.name}' not found in main program.`) : (i.enableVertexAttribArray(r), i.vertexAttribPointer(
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
      l.warn("updateLinesTransform: UBO not available.");
      return;
    }
    const o = [], r = [];
    for (const s of t) {
      if (s < 0 || s >= this.numLines) {
        l.warn(`updateLinesTransform: Invalid lineId ${s}.`);
        continue;
      }
      const n = s * this.lineDataStride + L;
      this.lineDataView.setFloat32(n + 0 * A, e[0], !0), this.lineDataView.setFloat32(n + 1 * A, e[1], !0), this.lineDataView.setFloat32(n + 2 * A, i[0], !0), this.lineDataView.setFloat32(n + 3 * A, i[1], !0);
      const h = new Float32Array(this.lineDataArrayBuffer, n, 4);
      o.push(n), r.push(h);
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
      l.warn(`updateLineColor: Invalid lineId ${t}`);
      return;
    }
    if (!this.lineDataUBO) {
      l.warn("updateLineColor: UBO not available.");
      return;
    }
    const i = t * this.lineDataStride + B;
    this.lineDataView.setFloat32(i + 0 * A, e[0], !0), this.lineDataView.setFloat32(i + 1 * A, e[1], !0), this.lineDataView.setFloat32(i + 2 * A, e[2], !0), this.lineDataView.setFloat32(i + 3 * A, e[3], !0), this.reusableFloat32Array4.set(e), this.updateUBOData([i], [this.reusableFloat32Array4]);
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
    const i = t * this.lineDataStride + V;
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
    for (const o of t) {
      if (o < 0 || o >= this.numLines) {
        l.warn(`setLinesEnabled: Invalid lineId ${o}.`);
        continue;
      }
      if (this.lineEnabledStatus[o] !== e) {
        this.lineEnabledStatus[o] = e;
        const r = e ? this.lineOriginalNumPointsCache[o] : 0, s = o * this.lineDataStride + w + 1 * D;
        this.lineDataView.setInt32(s, r, !0), i.push({ byteOffset: s, numPoints: r });
      }
    }
    if (i.length > 0) {
      const o = [], r = [];
      for (const s of i)
        this.reusableInt32Array1[0] = s.numPoints, o.push(s.byteOffset), r.push(this.reusableInt32Array1.slice());
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
      return l.log("transformToLogSpace: No log axes enabled, no scaling needed"), !0;
    let e;
    t ? (e = t, l.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (this.logX && e.coordinateSpace.x === "log" || this.logY && e.coordinateSpace.y === "log") && (l.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = N(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));
    const o = it(i, this.logX, this.logY);
    if (!o)
      return l.log("transformToLogSpace: Cannot transform bounds to log space"), !1;
    const [r, s, n, h] = U(o);
    return this.setGlobalTransform([r, s], [n, h]), l.log(`transformToLogSpace: Applied new transform - Scale[${r.toFixed(4)}, ${s.toFixed(4)}], Offset[${n.toFixed(4)}, ${h.toFixed(4)}]`), !0;
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
    t ? (e = t, l.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)) : (e = C(this.globalScale, this.globalOffset, this.logX, this.logY), l.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));
    let i = e;
    e.coordinateSpace && (e.coordinateSpace.x === "log" || e.coordinateSpace.y === "log") && (l.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`), i = N(
      e,
      e.coordinateSpace.x === "log",
      e.coordinateSpace.y === "log"
    ), l.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)), i.coordinateSpace = {
      x: "linear",
      y: "linear"
    };
    const [o, r, s, n] = U(i);
    return this.setGlobalTransform([o, r], [s, n]), l.log(`transformToLinearSpace: Applied linear transform - Scale[${o.toFixed(4)}, ${r.toFixed(4)}], Offset[${s.toFixed(4)}, ${n.toFixed(4)}]`), !0;
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
    const o = this.gl, r = this.lineStartIndexCache[t];
    for (let s = 0; s < i; s++) {
      const n = (r + s) * 2 + 1;
      if (n < this.pointsData.length)
        this.pointsData[n] = e[s];
      else {
        l.error(
          `updateLineY: Index ${n} OOB length ${this.pointsData.length}.`
        );
        return;
      }
    }
    if (o.activeTexture(o.TEXTURE0), o.bindTexture(o.TEXTURE_2D, this.pointsTexture), i <= this.texWidth) {
      const s = Math.floor(r / this.texWidth), n = r % this.texWidth;
      if (n + i <= this.texWidth) {
        const h = r * 2, u = i * 2, g = new Float32Array(
          this.pointsData.buffer,
          this.pointsData.byteOffset + h * A,
          u
        );
        o.texSubImage2D(o.TEXTURE_2D, 0, n, s, i, 1, o.RG, o.FLOAT, g);
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
      const s = Math.floor(o / this.texWidth), n = o % this.texWidth, h = this.texWidth - n, u = r - o, g = Math.min(h, u);
      if (g <= 0) break;
      const p = o * 2, _ = g * 2, b = new Float32Array(
        this.pointsData.buffer,
        this.pointsData.byteOffset + p * A,
        _
      );
      t.texSubImage2D(t.TEXTURE_2D, 0, n, s, g, 1, t.RG, t.FLOAT, b), o += g;
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
    if (e + V + A > this.lineDataView.byteLength) {
      l.warn(`getLineConfig: lineId ${t} results in offset out of bounds for lineDataView.`);
      return;
    }
    const i = {};
    i.scale = [
      this.lineDataView.getFloat32(e + L + 0 * A, !0),
      this.lineDataView.getFloat32(e + L + 1 * A, !0)
    ], i.offset = [
      this.lineDataView.getFloat32(e + L + 2 * A, !0),
      this.lineDataView.getFloat32(e + L + 3 * A, !0)
    ], i.color = [
      this.lineDataView.getFloat32(e + B + 0 * A, !0),
      this.lineDataView.getFloat32(e + B + 1 * A, !0),
      this.lineDataView.getFloat32(e + B + 2 * A, !0),
      this.lineDataView.getFloat32(e + B + 3 * A, !0)
    ], i.thickness = this.lineDataView.getFloat32(e + V, !0);
    const o = this.lineDataView.getInt32(e + w + 1 * D, !0);
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
const mt = `#version 300 es
  layout(location = 0) in vec2 a_position;

  uniform vec2 u_polygon_scale;
  uniform vec2 u_polygon_offset;
  uniform vec2 u_global_scale;
  uniform vec2 u_global_offset;

  void main() {
    vec2 scaled_position = a_position * u_polygon_scale + u_polygon_offset;
    gl_Position = vec4(scaled_position * u_global_scale + u_global_offset, 0.0, 1.0);
  }
`, pt = `#version 300 es
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
`, Z = `#version 300 es
  precision mediump float;
  uniform vec4 u_color;
  uniform float u_opacity;
  out vec4 outColor;

  void main() {
    outColor = vec4(u_color.rgb, u_color.a * u_opacity);
  }
`;
class Pt {
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
    }, this.prog = this._createShaderProgram(mt, Z), this.strokeProg = this._createShaderProgram(pt, Z), !this.prog)
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
        l.warn(
          "WebglPolygonPlot: Polygon points array length should be even (x,y pairs). Skipping polygon."
        );
        continue;
      }
      this.polygonStarts.push(e / 2);
      const s = r.points.length / 2;
      this.polygonLengths.push(s), e += r.points.length;
    }
    if (e === 0 && this.numPolygons > 0) {
      l.warn(
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
      l.error(
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
        const s = this.strokePolygonStarts[o], n = this.strokePolygonLengths[o];
        n > 0 && t.drawArrays(t.TRIANGLE_STRIP, s, n);
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
    return t < 0 || t >= this.numPolygons ? (l.warn(`WebglPolygonPlot: Invalid polygonId for ${e}.`), !1) : !0;
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
      const s = r.points.length / 2;
      if (s < 3) {
        this.strokePolygonStarts.push(0), this.strokePolygonLengths.push(0);
        continue;
      }
      this.strokePolygonStarts.push(t);
      const n = s * 4;
      this.strokePolygonLengths.push(n), t += n;
    }
    if (t === 0) return;
    const e = new Float32Array(t * 5);
    let i = 0;
    for (let o = 0; o < this.numPolygons; o++) {
      const r = this.polygonsConfig[o];
      if (!r.isStroked || r.strokeWeight <= 0) continue;
      const s = r.points.length / 2;
      if (!(s < 3))
        for (let n = 0; n < s; n++) {
          const h = n, u = (n + 1) % s, g = r.points[h * 2], p = r.points[h * 2 + 1], _ = r.points[u * 2], b = r.points[u * 2 + 1], c = _ - g, f = b - p, x = Math.sqrt(c * c + f * f);
          if (x === 0) continue;
          const d = -f / x, m = c / x;
          e[i++] = g, e[i++] = p, e[i++] = d, e[i++] = m, e[i++] = -1, e[i++] = _, e[i++] = b, e[i++] = d, e[i++] = m, e[i++] = -1, e[i++] = g, e[i++] = p, e[i++] = d, e[i++] = m, e[i++] = 1, e[i++] = _, e[i++] = b, e[i++] = d, e[i++] = m, e[i++] = 1;
        }
    }
    this.strokeVertexBuffer = this.gl.createBuffer(), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.strokeVertexBuffer), this.gl.bufferData(this.gl.ARRAY_BUFFER, e, this.gl.STATIC_DRAW), this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null), this._setupStrokeVAO();
  }
  _createShaderProgram(t, e) {
    const i = this.gl, o = this._compileShader(i.VERTEX_SHADER, t), r = this._compileShader(i.FRAGMENT_SHADER, e);
    if (!o || !r)
      return null;
    const s = i.createProgram();
    return s ? (i.attachShader(s, o), i.attachShader(s, r), i.linkProgram(s), i.getProgramParameter(s, i.LINK_STATUS) ? (i.deleteShader(o), i.deleteShader(r), s) : (l.error(
      `Shader program linking error: ${i.getProgramInfoLog(s) || "Unknown error"}`
    ), i.deleteProgram(s), i.deleteShader(o), i.deleteShader(r), null)) : (l.error("Failed to create shader program."), null);
  }
  _compileShader(t, e) {
    const i = this.gl, o = i.createShader(t);
    if (!o)
      return l.error("Failed to create shader."), null;
    if (i.shaderSource(o, e), i.compileShader(o), !i.getShaderParameter(o, i.COMPILE_STATUS)) {
      const r = t === i.VERTEX_SHADER ? "Vertex" : "Fragment";
      return l.error(
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
      strokeColor: s = [0, 0, 0, 1],
      strokeWeight: n = 1,
      isFilled: h = !0,
      isStroked: u = !1,
      scale: g,
      offset: p,
      enabled: _ = !0
    } = t, b = new Float32Array(6);
    for (let c = 0; c < 3; c++) {
      const f = o + c * 2 * Math.PI / 3;
      b[c * 2] = e[0] + i * Math.cos(f), b[c * 2 + 1] = e[1] + i * Math.sin(f);
    }
    return {
      points: b,
      fillColor: r,
      strokeColor: s,
      strokeWeight: n,
      isFilled: h,
      isStroked: u,
      scale: g,
      offset: p,
      enabled: _
    };
  }
  static createSquare(t) {
    const {
      center: e,
      size: i,
      rotation: o = 0,
      fillColor: r = [0.8, 0.8, 0.8, 0.5],
      strokeColor: s = [0, 0, 0, 1],
      strokeWeight: n = 1,
      isFilled: h = !0,
      isStroked: u = !1,
      scale: g,
      offset: p,
      enabled: _ = !0
    } = t, b = i / 2, c = [
      [-b, -b],
      [b, -b],
      [b, b],
      [-b, b]
    ], f = new Float32Array(8), x = Math.cos(o), d = Math.sin(o);
    for (let m = 0; m < 4; m++) {
      const [S, P] = c[m], F = S * x - P * d, v = S * d + P * x;
      f[m * 2] = e[0] + F, f[m * 2 + 1] = e[1] + v;
    }
    return {
      points: f,
      fillColor: r,
      strokeColor: s,
      strokeWeight: n,
      isFilled: h,
      isStroked: u,
      scale: g,
      offset: p,
      enabled: _
    };
  }
  static createCircle(t) {
    const {
      center: e,
      radius: i,
      segments: o = 32,
      fillColor: r = [0.8, 0.8, 0.8, 0.5],
      strokeColor: s = [0, 0, 0, 1],
      strokeWeight: n = 1,
      isFilled: h = !0,
      isStroked: u = !1,
      scale: g,
      offset: p,
      enabled: _ = !0
    } = t;
    o < 3 && l.warn(
      "WebglPolygonPlot.createCircle: segments must be 3 or more. Defaulting to 3."
    );
    const b = new Float32Array(o * 2), c = 2 * Math.PI / o;
    for (let f = 0; f < o; f++) {
      const x = f * c;
      b[f * 2] = e[0] + i * Math.cos(x), b[f * 2 + 1] = e[1] + i * Math.sin(x);
    }
    return {
      points: b,
      fillColor: r,
      strokeColor: s,
      strokeWeight: n,
      isFilled: h,
      isStroked: u,
      scale: g,
      offset: p,
      enabled: _
    };
  }
}
class Ft {
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
    this.prog = ot(t, i, o), this.uScale = t.getUniformLocation(this.prog, "u_scale"), this.uOffset = t.getUniformLocation(this.prog, "u_offset"), this.vao = t.createVertexArray(), t.bindVertexArray(this.vao), this.positionBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.positionBuffer), t.bufferData(t.ARRAY_BUFFER, e * 2 * 2 * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), this.colorBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.colorBuffer), t.bufferData(t.ARRAY_BUFFER, e * 2 * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 4, t.UNSIGNED_BYTE, !0, 0, 0), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.enable(t.BLEND), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA);
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
    const s = this.gl;
    this.posScratch[0] = t, this.posScratch[1] = e, this.posScratch[2] = i, this.posScratch[3] = o;
    for (let n = 0; n < 2; n++)
      this.colorScratch[n * 4] = r[0] * 255, this.colorScratch[n * 4 + 1] = r[1] * 255, this.colorScratch[n * 4 + 2] = r[2] * 255, this.colorScratch[n * 4 + 3] = r[3] * 255;
    s.bindBuffer(s.ARRAY_BUFFER, this.positionBuffer), s.bufferSubData(s.ARRAY_BUFFER, this.head * 16, this.posScratch), s.bindBuffer(s.ARRAY_BUFFER, this.colorBuffer), s.bufferSubData(s.ARRAY_BUFFER, this.head * 8, this.colorScratch), s.bindBuffer(s.ARRAY_BUFFER, null), this.head = (this.head + 1) % this.maxSegments, this.count < this.maxSegments && this.count++;
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
function ot(a, t, e) {
  const i = (n, h) => {
    const u = a.createShader(n);
    if (!u) throw new Error("Unable to create shader");
    if (a.shaderSource(u, h), a.compileShader(u), !a.getShaderParameter(u, a.COMPILE_STATUS)) {
      const g = a.getShaderInfoLog(u) || "Unknown error";
      throw a.deleteShader(u), l.error(`Shader compilation failed: ${g}`), new Error(g);
    }
    return u;
  }, o = i(a.VERTEX_SHADER, t), r = i(a.FRAGMENT_SHADER, e), s = a.createProgram();
  if (a.attachShader(s, o), a.attachShader(s, r), a.linkProgram(s), a.detachShader(s, o), a.detachShader(s, r), a.deleteShader(o), a.deleteShader(r), !a.getProgramParameter(s, a.LINK_STATUS)) {
    const n = a.getProgramInfoLog(s) || "Unknown error";
    throw a.deleteProgram(s), l.error(`Program link failed: ${n}`), new Error(n);
  }
  return s;
}
class yt {
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
    this.prog = ot(t, i, o), this.uScale = t.getUniformLocation(this.prog, "u_scale"), this.uOffset = t.getUniformLocation(this.prog, "u_offset"), this.uResolution = t.getUniformLocation(this.prog, "u_resolution"), this.vao = t.createVertexArray(), t.bindVertexArray(this.vao), this.cornerBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.cornerBuffer), t.bufferData(t.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), t.STATIC_DRAW), t.enableVertexAttribArray(0), t.vertexAttribPointer(0, 2, t.FLOAT, !1, 0, 0), this.positionBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.positionBuffer), t.bufferData(t.ARRAY_BUFFER, e * 2 * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(1), t.vertexAttribPointer(1, 2, t.FLOAT, !1, 0, 0), t.vertexAttribDivisor(1, 1), this.radiusBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.radiusBuffer), t.bufferData(t.ARRAY_BUFFER, e * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(2), t.vertexAttribPointer(2, 1, t.FLOAT, !1, 0, 0), t.vertexAttribDivisor(2, 1), this.colorBuffer = t.createBuffer(), t.bindBuffer(t.ARRAY_BUFFER, this.colorBuffer), t.bufferData(t.ARRAY_BUFFER, e * 4, t.DYNAMIC_DRAW), t.enableVertexAttribArray(3), t.vertexAttribPointer(3, 4, t.UNSIGNED_BYTE, !0, 0, 0), t.vertexAttribDivisor(3, 1), t.bindVertexArray(null), t.bindBuffer(t.ARRAY_BUFFER, null), t.enable(t.BLEND), t.blendFunc(t.SRC_ALPHA, t.ONE_MINUS_SRC_ALPHA);
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
class rt {
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
    this.internalPlotter instanceof R ? this.internalPlotter.updateLinePoints(t, e) : this.internalPlotter instanceof E ? l.warn(
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
    this.internalPlotter instanceof E ? this.internalPlotter.updateLineThickness(t, e) : this.internalPlotter instanceof R && (this.internalPlotter.updateLineThickness(t, 1), l.warn(
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
    this.internalPlotter && (this.internalPlotter instanceof R ? this.internalPlotter.setMultipleLinesEnabled(t, e) : this.internalPlotter instanceof E && this.internalPlotter.setLinesEnabled(t, e));
  }
  /**
   * Update transform parameters for multiple lines at once.
   * @param lineIds Array of line IDs to update
   * @param scale Scale factors [scaleX, scaleY]
   * @param offset Offset values [offsetX, offsetY]
   */
  updateMultipleLinesTransform(t, e, i) {
    this.internalPlotter && (this.internalPlotter instanceof R ? this.internalPlotter.updateMultipleLinesTransform(t, e, i) : this.internalPlotter instanceof E && this.internalPlotter.updateLinesTransform(t, e, i));
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
    return this.internalPlotter instanceof R ? "WebglLinePlot" : this.internalPlotter instanceof E ? "WebglLineThick" : "null";
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
function z(a, t) {
  const e = t ?? (window.devicePixelRatio || 1);
  a.width = a.clientWidth * e, a.height = a.clientHeight * e;
}
function st(a, t) {
  const e = {
    antialias: t?.antialias ?? !0,
    alpha: t?.transparent ?? !1,
    desynchronized: t?.deSync,
    powerPreference: t?.powerPerformance,
    preserveDrawingBuffer: t?.preserveDrawing
  }, i = a.getContext("webgl2", e);
  if (!i)
    throw new Error("WebGL2 is not supported or context creation failed");
  return i.viewport(0, 0, a.width, a.height), i.enable(i.BLEND), i.blendFunc(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA), i;
}
function xt(a) {
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
function X(a, t, e, i, o) {
  let r;
  if (typeof t == "string")
    r = xt(t);
  else if (Array.isArray(t))
    r = t;
  else if (typeof t == "number" && e !== void 0 && i !== void 0 && o !== void 0)
    r = [t, e, i, o];
  else
    throw new Error(
      "Invalid arguments. Use either CSS color string, color array, or individual RGBA values."
    );
  a.clearColor(r[0], r[1], r[2], r[3]);
}
function W(a, t) {
  t && X(a, t), a.clear(a.COLOR_BUFFER_BIT);
}
function nt(a, t) {
  a.viewport(0, 0, t.width, t.height);
}
function G(a, t) {
  z(a, t?.devicePixelRatio);
  const e = st(a, t);
  return t?.backgroundColor ? X(e, t.backgroundColor) : X(e, [0, 0, 0, 1]), e;
}
function St(a, t, e) {
  z(a, e), nt(t, a);
}
const Lt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clearCanvas: W,
  createWebGL2Context: st,
  handleCanvasResize: St,
  setBackgroundColor: X,
  setupCanvas: z,
  setupCanvasAndWebGL: G,
  updateViewport: nt
}, Symbol.toStringTag, { value: "Module" })), k = [
  [0.12, 0.47, 0.71, 1],
  [1, 0.5, 0.05, 1],
  [0.17, 0.63, 0.17, 1],
  [0.84, 0.15, 0.16, 1],
  [0.58, 0.4, 0.74, 1],
  [0.55, 0.34, 0.29, 1]
];
function bt(a) {
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
function J(a, t, e) {
  if (e) {
    if (e[0] === e[1])
      throw new Error(`plot: ${t}-range must span a non-zero interval`);
    return e;
  }
  let i = 1 / 0, o = -1 / 0;
  for (const r of a) {
    const s = r[t];
    for (let n = 0; n < s.length; n++) {
      const h = s[n];
      h < i && (i = h), h > o && (o = h);
    }
  }
  if (!isFinite(i) || !isFinite(o))
    throw new Error(`plot: cannot compute ${t}-range from empty data`);
  return i === o && (i -= 1, o += 1), [i, o];
}
function Q(a, t, e) {
  if (a.x.length !== a.y.length)
    throw new Error("plot: series x and y must have the same length");
  const i = t[1] - t[0], o = e[1] - e[0], r = new Float32Array(a.x.length * 2);
  for (let s = 0; s < a.x.length; s++)
    r[s * 2] = (a.x[s] - t[0]) / i * 2 - 1, r[s * 2 + 1] = (a.y[s] - e[0]) / o * 2 - 1;
  return r;
}
function tt(a, t, e) {
  const i = a.type ?? "line";
  if (i !== "line" && i !== "scatter")
    throw new Error(`plot: unsupported type "${String(i)}"`);
  const o = Array.isArray(a.data) ? a.data : [a.data];
  if (o.length === 0)
    throw new Error("plot: data must contain at least one series");
  const r = J(o, "x", a["x-range"]), s = J(o, "y", a["y-range"]);
  let n, h;
  if (i === "line") {
    const u = new rt(e, o.length);
    u.initLines(
      o.map((g, p) => ({
        points: Q(g, r, s),
        color: g.color ?? k[p % k.length],
        thickness: g.thickness ?? 1,
        enabled: !0
      }))
    ), n = () => u.draw(), h = () => u.cleanup();
  } else {
    const u = o.reduce((p, _) => p + _.x.length, 0), g = new ht(e, u);
    g.setSquareSize((a.markerSize ?? 8) / t.width), g.setColor(new M(1, 1, 1, 1));
    for (let p = 0; p < o.length; p++) {
      const _ = o[p], b = Q(_, r, s), c = _.color ?? k[p % k.length], f = new Uint8Array(_.x.length * 3);
      for (let x = 0; x < _.x.length; x++)
        f[x * 3] = Math.round(c[0] * 255), f[x * 3 + 1] = Math.round(c[1] * 255), f[x * 3 + 2] = Math.round(c[2] * 255);
      g.addSquare(b, f);
    }
    n = () => g.draw(), h = () => {
    };
  }
  return { xRange: r, yRange: s, draw: n, cleanup: h };
}
function Bt(a) {
  const t = bt(a.canvas), e = G(t, {
    antialias: !0,
    backgroundColor: a.backgroundColor ?? [0, 0, 0, 1]
  });
  let i = { ...a }, o = tt(i, t, e);
  const r = () => {
    W(e), o.draw();
  };
  r();
  const s = {
    canvas: t,
    gl: e,
    xRange: o.xRange,
    yRange: o.yRange,
    update: (n) => {
      const h = { ...i, ...n, canvas: t }, u = tt(h, t, e);
      o.cleanup(), i = h, o = u, s.xRange = o.xRange, s.yRange = o.yRange, r();
    },
    redraw: r,
    destroy: () => o.cleanup()
  };
  return s;
}
class Rt {
  gl;
  gScaleX = 1;
  gScaleY = 1;
  gOffsetX = 0;
  gOffsetY = 0;
  logX = !1;
  logY = !1;
  debug = !1;
  constructor(t, e) {
    this.gl = G(t, e);
  }
  clear() {
    W(this.gl);
  }
  update() {
  }
  newUnifiedLinePlotter(t) {
    return new rt(this.gl, t);
  }
  newThinLinePlotter(t) {
    return new R(this.gl, t);
  }
  newThickLinePlotter(t) {
    return new E(this.gl, t);
  }
}
export {
  M as ColorRGBA,
  l as DebugLogger,
  rt as UnifiedLinePlot,
  Lt as WebGLHelpers,
  _t as WebglAux,
  yt as WebglDots,
  At as WebglLine,
  R as WebglLinePlot,
  vt as WebglLineRoll,
  E as WebglLineThick,
  Rt as WebglPlot,
  Pt as WebglPolygonPlot,
  ht as WebglScatterAcc,
  Ft as WebglSegments,
  W as clearCanvas,
  st as createWebGL2Context,
  St as handleCanvasResize,
  Bt as plot,
  X as setBackgroundColor,
  z as setupCanvas,
  G as setupCanvasAndWebGL,
  N as transformBoundsToLinearSpace,
  it as transformBoundsToLogSpace,
  nt as updateViewport
};
