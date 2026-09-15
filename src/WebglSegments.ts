import { DebugLogger } from "./DebugLogger";

/**
 * Batched renderer for many independent thin line segments (GL_LINES), each
 * with its own RGBA color, drawn in a single draw call.
 *
 * Segments live in a fixed-capacity ring buffer: once `maxSegments` have been
 * added, the oldest are overwritten. Coordinates are stored in data space and
 * mapped to clip space by a global scale/offset, so scrolling or rescaling only
 * touches uniforms.
 */
export class WebglSegments {
  private gl: WebGL2RenderingContext;
  private maxSegments: number;
  private head = 0;
  private count = 0;
  private positionBuffer: WebGLBuffer;
  private colorBuffer: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private prog: WebGLProgram;
  private uScale: WebGLUniformLocation | null;
  private uOffset: WebGLUniformLocation | null;
  private scale: [number, number] = [1, 1];
  private offset: [number, number] = [0, 0];
  private posScratch = new Float32Array(4);
  private colorScratch = new Uint8Array(8);

  constructor(gl: WebGL2RenderingContext, maxSegments: number) {
    this.gl = gl;
    this.maxSegments = maxSegments;

    const vs = `#version 300 es
      layout(location = 0) in vec2 a_position;
      layout(location = 1) in vec4 a_color;
      uniform vec2 u_scale;
      uniform vec2 u_offset;
      out vec4 v_color;
      void main() {
        gl_Position = vec4(a_position * u_scale + u_offset, 0.0, 1.0);
        v_color = a_color;
      }`;
    const fs = `#version 300 es
      precision mediump float;
      in vec4 v_color;
      out vec4 outColor;
      void main() { outColor = v_color; }`;

    this.prog = createProgram(gl, vs, fs);
    this.uScale = gl.getUniformLocation(this.prog, "u_scale");
    this.uOffset = gl.getUniformLocation(this.prog, "u_offset");

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxSegments * 2 * 2 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxSegments * 2 * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 0, 0);

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
   * Append a segment from (x0, y0) to (x1, y1) in data space.
   * @param color RGBA in 0..1
   */
  public addSegment(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: [number, number, number, number]
  ): void {
    const gl = this.gl;
    this.posScratch[0] = x0;
    this.posScratch[1] = y0;
    this.posScratch[2] = x1;
    this.posScratch[3] = y1;
    for (let v = 0; v < 2; v++) {
      this.colorScratch[v * 4] = color[0] * 255;
      this.colorScratch[v * 4 + 1] = color[1] * 255;
      this.colorScratch[v * 4 + 2] = color[2] * 255;
      this.colorScratch[v * 4 + 3] = color[3] * 255;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, this.head * 16, this.posScratch);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, this.head * 8, this.colorScratch);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.head = (this.head + 1) % this.maxSegments;
    if (this.count < this.maxSegments) this.count++;
  }

  /** Remove all segments (buffer contents are simply ignored). */
  public clear(): void {
    this.head = 0;
    this.count = 0;
  }

  public get numSegments(): number {
    return this.count;
  }

  public draw(): void {
    if (this.count === 0) return;
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniform2f(this.uScale, this.scale[0], this.scale[1]);
    gl.uniform2f(this.uOffset, this.offset[0], this.offset[1]);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.LINES, 0, this.count * 2);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  public cleanup(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.positionBuffer);
    gl.deleteBuffer(this.colorBuffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.prog);
    this.count = 0;
  }
}

export function createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const compile = (type: number, source: string): WebGLShader => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Unable to create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) || "Unknown error";
      gl.deleteShader(shader);
      DebugLogger.error(`Shader compilation failed: ${log}`);
      throw new Error(log);
    }
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.detachShader(prog, vs);
  gl.detachShader(prog, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) || "Unknown error";
    gl.deleteProgram(prog);
    DebugLogger.error(`Program link failed: ${log}`);
    throw new Error(log);
  }
  return prog;
}
