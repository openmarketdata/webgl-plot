import { createProgram } from "./WebglSegments";

/**
 * Instanced renderer for anti-aliased round dots, each with its own position,
 * pixel radius and RGBA color, drawn in a single draw call.
 *
 * Dots live in a fixed-capacity ring buffer: once `maxDots` have been added,
 * the oldest are overwritten. Positions are stored in data space and mapped to
 * clip space by a global scale/offset; radii are in device pixels so dots keep
 * their size when the transform changes.
 */
export class WebglDots {
  private gl: WebGL2RenderingContext;
  private maxDots: number;
  private head = 0;
  private count = 0;
  private cornerBuffer: WebGLBuffer;
  private positionBuffer: WebGLBuffer;
  private radiusBuffer: WebGLBuffer;
  private colorBuffer: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private prog: WebGLProgram;
  private uScale: WebGLUniformLocation | null;
  private uOffset: WebGLUniformLocation | null;
  private uResolution: WebGLUniformLocation | null;
  private scale: [number, number] = [1, 1];
  private offset: [number, number] = [0, 0];
  private posScratch = new Float32Array(2);
  private radiusScratch = new Float32Array(1);
  private colorScratch = new Uint8Array(4);

  constructor(gl: WebGL2RenderingContext, maxDots: number) {
    this.gl = gl;
    this.maxDots = maxDots;

    const vs = `#version 300 es
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
      }`;
    const fs = `#version 300 es
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

    this.prog = createProgram(gl, vs, fs);
    this.uScale = gl.getUniformLocation(this.prog, "u_scale");
    this.uOffset = gl.getUniformLocation(this.prog, "u_offset");
    this.uResolution = gl.getUniformLocation(this.prog, "u_resolution");

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxDots * 2 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);

    this.radiusBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.radiusBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxDots * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxDots * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 0, 0);
    gl.vertexAttribDivisor(3, 1);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /** Map data space to clip space: clip = data * scale + offset. */
  public setGlobalTransform(scale: [number, number], offset: [number, number]): void {
    this.scale = scale;
    this.offset = offset;
  }

  /**
   * Append a dot at (x, y) in data space.
   * @param radius radius in device pixels
   * @param color RGBA in 0..1
   */
  public addDot(x: number, y: number, radius: number, color: [number, number, number, number]): void {
    const gl = this.gl;
    this.posScratch[0] = x;
    this.posScratch[1] = y;
    this.radiusScratch[0] = radius;
    this.colorScratch[0] = color[0] * 255;
    this.colorScratch[1] = color[1] * 255;
    this.colorScratch[2] = color[2] * 255;
    this.colorScratch[3] = color[3] * 255;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, this.head * 8, this.posScratch);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.radiusBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, this.head * 4, this.radiusScratch);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, this.head * 4, this.colorScratch);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.head = (this.head + 1) % this.maxDots;
    if (this.count < this.maxDots) this.count++;
  }

  /** Remove all dots (buffer contents are simply ignored). */
  public clear(): void {
    this.head = 0;
    this.count = 0;
  }

  public get numDots(): number {
    return this.count;
  }

  public draw(): void {
    if (this.count === 0) return;
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniform2f(this.uScale, this.scale[0], this.scale[1]);
    gl.uniform2f(this.uOffset, this.offset[0], this.offset[1]);
    gl.uniform2f(this.uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.count);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  public cleanup(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.cornerBuffer);
    gl.deleteBuffer(this.positionBuffer);
    gl.deleteBuffer(this.radiusBuffer);
    gl.deleteBuffer(this.colorBuffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.prog);
    this.count = 0;
  }
}
