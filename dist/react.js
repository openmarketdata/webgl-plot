"use strict";Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const O=require("react");class l{static debugEnabled=!1;static setDebugMode(t){l.debugEnabled=t}static isDebugEnabled(){return l.debugEnabled}static log(t){l.debugEnabled&&console.log(`[webglplot] ${t}`)}static warn(t){l.debugEnabled&&console.warn(`[webglplot] ${t}`)}static error(t){console.error(`[webglplot] ${t}`)}}const H=1e-9;function M(r,t,e){if(!t&&!e){const s=r.length/2;return{isValid:!0,validPointCount:s,totalPoints:s,validRatio:1}}let i=0;const n=r.length/2;for(let s=0;s<r.length;s+=2){const f=r[s],d=r[s+1],u=!t||f>0,x=!e||d>0;u&&x&&i++}const o=i/n;return{isValid:i>=2&&o>=.1,validPointCount:i,totalPoints:n,validRatio:o}}function Z(r,t,e){let i=1/0,n=-1/0,o=1/0,a=-1/0,s=!1;for(let f=0;f<r.length;f+=2){let d=r[f],u=r[f+1];t&&d<=0||e&&u<=0||(t&&d>0&&(d=Math.log10(d)),e&&u>0&&(u=Math.log10(u)),s=!0,d<i&&(i=d),d>n&&(n=d),u<o&&(o=u),u>a&&(a=u))}return!s||!isFinite(i)||!isFinite(n)||!isFinite(o)||!isFinite(a)?null:{minX:i,maxX:n,minY:o,maxY:a,coordinateSpace:{x:t?"log":"linear",y:e?"log":"linear"}}}function C(r){const{minX:t,maxX:e,minY:i,maxY:n}=r,o=e-t,a=n-i,s=2,f=2;let d=1,u=1,x=0,v=0;return o>H?(d=s/o,x=0-(t+o/2)*d):(d=1,x=0-t*d),a>H?(u=f/a,v=0-(i+a/2)*u):(u=1,v=0-i*u),[d,u,x,v]}function J(r,t,e){const{minX:i,maxX:n,minY:o,maxY:a}=r;return t&&(i<=0||n<=0)?(l.log("transformBoundsToLogSpace: Cannot transform X bounds - contains non-positive values"),null):e&&(o<=0||a<=0)?(l.log("transformBoundsToLogSpace: Cannot transform Y bounds - contains non-positive values"),null):{minX:t?Math.log10(i):i,maxX:t?Math.log10(n):n,minY:e?Math.log10(o):o,maxY:e?Math.log10(a):a,coordinateSpace:{x:t?"log":r.coordinateSpace.x,y:e?"log":r.coordinateSpace.y}}}function V(r,t,e){const{minX:i,maxX:n,minY:o,maxY:a}=r;return{minX:t?Math.pow(10,i):i,maxX:t?Math.pow(10,n):n,minY:e?Math.pow(10,o):o,maxY:e?Math.pow(10,a):a,coordinateSpace:{x:t?"linear":r.coordinateSpace.x,y:e?"linear":r.coordinateSpace.y}}}function U(r,t,e,i){const[n,o]=r,[a,s]=t,f=(-1-a)/n,d=(1-a)/n,u=(-1-s)/o,x=(1-s)/o;return{minX:f,maxX:d,minY:u,maxY:x,coordinateSpace:{x:e?"log":"linear",y:i?"log":"linear"}}}class w{gl;maxLines;linesConfig=[];numLines=0;vertexBuffer=null;colorBuffer=null;prog=null;lineStarts=[];lineLengths=[];globalScale=[1,1];globalOffset=[0,0];locations={};logX=!1;logY=!1;constructor(t,e){if(this.gl=t,this.maxLines=e,this.linesConfig=[],this.numLines=0,this.vertexBuffer=null,this.colorBuffer=null,this.lineStarts=[],this.lineLengths=[],this.globalScale=[1,1],this.globalOffset=[0,0],this.prog=this._createShaderProgram(),!this.prog){l.error("Failed to create shader program.");return}this.locations={a_position:t.getAttribLocation(this.prog,"a_position"),a_color:t.getAttribLocation(this.prog,"a_color"),u_line_scale:t.getUniformLocation(this.prog,"u_line_scale"),u_line_offset:t.getUniformLocation(this.prog,"u_line_offset"),u_global_scale:t.getUniformLocation(this.prog,"u_global_scale"),u_global_offset:t.getUniformLocation(this.prog,"u_global_offset"),u_opacity:t.getUniformLocation(this.prog,"u_opacity"),u_log_axis:t.getUniformLocation(this.prog,"u_log_axis")},t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA)}_createShaderProgram(){const t=this.gl,e=`#version 300 es
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
    `,i=`#version 300 es
      precision mediump float;
      in vec3 v_color;
      uniform float u_opacity;
      out vec4 outColor;

      void main() {
        outColor = vec4(v_color, u_opacity);
      }
    `,n=t.createShader(t.VERTEX_SHADER);if(!n)return l.error("Unable to create vertex shader"),null;if(t.shaderSource(n,e),t.compileShader(n),!t.getShaderParameter(n,t.COMPILE_STATUS))return l.error(`Error compiling vertex shader: ${t.getShaderInfoLog(n)||"Unknown error"}`),t.deleteShader(n),null;const o=t.createShader(t.FRAGMENT_SHADER);if(!o)return l.error("Unable to create fragment shader"),t.deleteShader(n),null;if(t.shaderSource(o,i),t.compileShader(o),!t.getShaderParameter(o,t.COMPILE_STATUS))return l.error(`Error compiling fragment shader: ${t.getShaderInfoLog(o)||"Unknown error"}`),t.deleteShader(n),t.deleteShader(o),null;const a=t.createProgram();return a?(t.attachShader(a,n),t.attachShader(a,o),t.linkProgram(a),t.getProgramParameter(a,t.LINK_STATUS)?(t.detachShader(a,n),t.detachShader(a,o),t.deleteShader(n),t.deleteShader(o),a):(l.error(`Error linking shader program: ${t.getProgramInfoLog(a)||"Unknown error"}`),t.deleteProgram(a),t.deleteShader(n),t.deleteShader(o),null)):(l.error("Unable to create shader program"),t.deleteShader(n),t.deleteShader(o),null)}initLines(t){const e=this.gl;if(t.length>this.maxLines?(l.warn(`Number of lines (${t.length}) exceeds maxLines (${this.maxLines}). Slicing.`),this.linesConfig=t.slice(0,this.maxLines).map(f=>({...f}))):this.linesConfig=t.map(f=>({...f})),this.numLines=this.linesConfig.length,this.lineStarts=[],this.lineLengths=[],this.vertexBuffer&&(e.deleteBuffer(this.vertexBuffer),this.vertexBuffer=null),this.colorBuffer&&(e.deleteBuffer(this.colorBuffer),this.colorBuffer=null),this.numLines===0)return;let i=0;for(const f of this.linesConfig){f.scale=f.scale||[1,1],f.offset=f.offset||[0,0],f.enabled===void 0&&(f.enabled=!0),f.thickness===void 0&&(f.thickness=1);const d=f.points.length/2;this.lineStarts.push(i),this.lineLengths.push(d),i+=d}const n=new Float32Array(i*2),o=new Float32Array(i*3);let a=0,s=0;for(let f=0;f<this.numLines;f++){const d=this.linesConfig[f];n.set(d.points,a);for(let u=0;u<this.lineLengths[f];u++)o[s++]=d.color[0],o[s++]=d.color[1],o[s++]=d.color[2];a+=d.points.length}this.vertexBuffer=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferData(e.ARRAY_BUFFER,n,e.STATIC_DRAW),this.colorBuffer=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.colorBuffer),e.bufferData(e.ARRAY_BUFFER,o,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null),this.prog&&this.locations.u_global_scale&&this.locations.u_global_offset&&(e.useProgram(this.prog),e.uniform2f(this.locations.u_global_scale,this.globalScale[0],this.globalScale[1]),e.uniform2f(this.locations.u_global_offset,this.globalOffset[0],this.globalOffset[1]),e.useProgram(null))}cleanup(){const t=this.gl;this.prog&&(t.deleteProgram(this.prog),this.prog=null),this.vertexBuffer&&(t.deleteBuffer(this.vertexBuffer),this.vertexBuffer=null),this.colorBuffer&&(t.deleteBuffer(this.colorBuffer),this.colorBuffer=null),this.linesConfig=[],this.numLines=0,this.lineStarts=[],this.lineLengths=[]}updateLinePoints(t,e){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for updateLinePoints`);return}if(!this.vertexBuffer){l.warn("Vertex buffer not initialized for updateLinePoints");return}const i=this.linesConfig[t],n=this.lineLengths[t];if(e.length/2!==n){l.warn(`Number of points in provided data (${e.length/2}) does not match existing points in line ${t} (${n}). Cannot change number of points with this method.`);return}i.points=e;const a=this.lineStarts[t]*2*Float32Array.BYTES_PER_ELEMENT,s=this.gl;s.bindBuffer(s.ARRAY_BUFFER,this.vertexBuffer),s.bufferSubData(s.ARRAY_BUFFER,a,e),s.bindBuffer(s.ARRAY_BUFFER,null)}updateLineY(t,e){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for updateLineY`);return}if(!this.vertexBuffer){l.warn("Vertex buffer not initialized for updateLineY");return}const i=this.linesConfig[t],n=this.lineLengths[t];if(e.length!==n){l.warn(`Length of newY array (${e.length}) does not match number of points in line ${t} (${n}).`);return}for(let f=0;f<n;f++)i.points[f*2+1]=e[f];const a=this.lineStarts[t]*2*Float32Array.BYTES_PER_ELEMENT,s=this.gl;s.bindBuffer(s.ARRAY_BUFFER,this.vertexBuffer),s.bufferSubData(s.ARRAY_BUFFER,a,i.points),s.bindBuffer(s.ARRAY_BUFFER,null)}updateLineColor(t,e){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for updateLineColor`);return}if(!this.colorBuffer){l.warn("Color buffer not initialized for updateLineColor");return}this.linesConfig[t].color=e;const i=this.lineStarts[t],n=this.lineLengths[t],o=new Float32Array(n*3);let a=0;for(let f=0;f<n;f++)o[a++]=e[0],o[a++]=e[1],o[a++]=e[2];const s=this.gl;s.bindBuffer(s.ARRAY_BUFFER,this.colorBuffer),s.bufferSubData(s.ARRAY_BUFFER,i*3*Float32Array.BYTES_PER_ELEMENT,o),s.bindBuffer(s.ARRAY_BUFFER,null)}updateLineTransform(t,e,i){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for updateLineTransform`);return}this.linesConfig[t].scale=e,this.linesConfig[t].offset=i}updateLineThickness(t,e){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for updateLineThickness`);return}this.linesConfig[t].thickness=e}setLineEnabled(t,e){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for setLineEnabled`);return}this.linesConfig[t].enabled=e}setMultipleLinesEnabled(t,e){for(const i of t)i>=0&&i<this.numLines?this.linesConfig[i].enabled=e:l.warn(`Invalid lineId ${i} in setMultipleLinesEnabled`)}updateMultipleLinesTransform(t,e,i){for(const n of t)n>=0&&n<this.numLines?(this.linesConfig[n].scale=[e[0],e[1]],this.linesConfig[n].offset=[i[0],i[1]]):l.warn(`Invalid lineId ${n} in updateMultipleLinesTransform`)}setGlobalTransform(t,e){this.globalScale=t,this.globalOffset=e,this.prog&&this.locations.u_global_scale&&this.locations.u_global_offset&&(this.gl.useProgram(this.prog),this.gl.uniform2f(this.locations.u_global_scale,this.globalScale[0],this.globalScale[1]),this.gl.uniform2f(this.locations.u_global_offset,this.globalOffset[0],this.globalOffset[1]),this.gl.useProgram(null))}setLogAxis(t,e){this.logX=t,this.logY=e}transformToLogSpace(t){if(!this.logX&&!this.logY)return l.log("transformToLogSpace: No log axes enabled, no scaling needed"),!0;let e;t?(e=t,l.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)):(e=U(this.globalScale,this.globalOffset,this.logX,this.logY),l.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));let i=e;e.coordinateSpace&&(this.logX&&e.coordinateSpace.x==="log"||this.logY&&e.coordinateSpace.y==="log")&&(l.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`),i=V(e,e.coordinateSpace.x==="log",e.coordinateSpace.y==="log"),l.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));const n=J(i,this.logX,this.logY);if(!n)return l.log("transformToLogSpace: Cannot transform bounds to log space"),!1;const[o,a,s,f]=C(n);return this.setGlobalTransform([o,a],[s,f]),l.log(`transformToLogSpace: Applied new transform - Scale[${o.toFixed(4)}, ${a.toFixed(4)}], Offset[${s.toFixed(4)}, ${f.toFixed(4)}]`),!0}transformToLinearSpace(t){let e;t?(e=t,l.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)):(e=U(this.globalScale,this.globalOffset,this.logX,this.logY),l.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));let i=e;e.coordinateSpace&&(e.coordinateSpace.x==="log"||e.coordinateSpace.y==="log")&&(l.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`),i=V(e,e.coordinateSpace.x==="log",e.coordinateSpace.y==="log"),l.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)),i.coordinateSpace={x:"linear",y:"linear"};const[n,o,a,s]=C(i);return this.setGlobalTransform([n,o],[a,s]),l.log(`transformToLinearSpace: Applied linear transform - Scale[${n.toFixed(4)}, ${o.toFixed(4)}], Offset[${a.toFixed(4)}, ${s.toFixed(4)}]`),!0}getAllDataBounds(){if(this.numLines===0)return null;let t=1/0,e=-1/0,i=1/0,n=-1/0,o=!1;for(let a=0;a<this.numLines;a++){const s=this.linesConfig[a];if(!s.enabled||s.points.length===0)continue;const f=s.points,d=M(f,this.logX,this.logY);if(!d.isValid){l.log(`getAllDataBounds: Skipping line ${a} - only ${d.validPointCount}/${d.totalPoints} (${(d.validRatio*100).toFixed(1)}%) points valid for log axes`);continue}o=!0;const u=Z(f,this.logX,this.logY);u&&(u.minX<t&&(t=u.minX),u.maxX>e&&(e=u.maxX),u.minY<i&&(i=u.minY),u.maxY>n&&(n=u.maxY))}return!o||!isFinite(t)||!isFinite(e)||!isFinite(i)||!isFinite(n)?null:{minX:t,maxX:e,minY:i,maxY:n,coordinateSpace:{x:this.logX?"log":"linear",y:this.logY?"log":"linear"}}}getDataBounds(){return U(this.globalScale,this.globalOffset,this.logX,this.logY)}autoScale(){if(this.numLines===0)return l.warn("No lines to auto-scale."),null;let t=1/0,e=-1/0,i=1/0,n=-1/0,o=!1;for(let x=0;x<this.numLines;x++){const v=this.linesConfig[x],F=v.scale,c=v.offset;if(!v.enabled||v.points.length===0)continue;const h=v.points,_=M(h,this.logX,this.logY);if(!_.isValid){l.log(`autoScale: Skipping line ${x} - only ${_.validPointCount}/${_.totalPoints} (${(_.validRatio*100).toFixed(1)}%) points valid for log axes`);continue}o=!0;for(let g=0;g<h.length;g+=2){let m=h[g],p=h[g+1];if(this.logX)if(m>0)m=Math.log10(m);else continue;if(this.logY)if(p>0)p=Math.log10(p);else continue;m=m*F[0]+c[0],p=p*F[1]+c[1],m<t&&(t=m),m>e&&(e=m),p<i&&(i=p),p>n&&(n=p)}}if(!o||!isFinite(t)||!isFinite(e)||!isFinite(i)||!isFinite(n))return l.warn("No data available for scaling or bounds are invalid. Resetting global transform."),this.setGlobalTransform([1,1],[0,0]),null;const a={minX:t,maxX:e,minY:i,maxY:n,coordinateSpace:{x:this.logX?"log":"linear",y:this.logY?"log":"linear"}},[s,f,d,u]=C(a);return l.log(`AutoScale Results: Bounds [${t.toFixed(3)}, ${e.toFixed(3)}], [${i.toFixed(3)}, ${n.toFixed(3)}] -> Global Scale: [${s.toFixed(4)}, ${f.toFixed(4)}], Offset: [${d.toFixed(4)}, ${u.toFixed(4)}]`),this.setGlobalTransform([s,f],[d,u]),a}draw=()=>{if(!this.prog||!this.vertexBuffer||!this.colorBuffer||this.numLines===0||!this.locations||this.locations.a_position===void 0||this.locations.a_color===void 0||!this.locations.u_global_scale||!this.locations.u_global_offset||!this.locations.u_line_scale||!this.locations.u_line_offset||!this.locations.u_opacity||!this.locations.u_log_axis)return;const t=this.gl;t.useProgram(this.prog),t.uniform2f(this.locations.u_global_scale,this.globalScale[0],this.globalScale[1]),t.uniform2f(this.locations.u_global_offset,this.globalOffset[0],this.globalOffset[1]),t.uniform2f(this.locations.u_log_axis,this.logX?1:0,this.logY?1:0),t.bindBuffer(t.ARRAY_BUFFER,this.vertexBuffer),t.vertexAttribPointer(this.locations.a_position,2,t.FLOAT,!1,0,0),t.enableVertexAttribArray(this.locations.a_position),t.bindBuffer(t.ARRAY_BUFFER,this.colorBuffer),t.vertexAttribPointer(this.locations.a_color,3,t.FLOAT,!1,0,0),t.enableVertexAttribArray(this.locations.a_color);for(let e=0;e<this.numLines;e++){const i=this.linesConfig[e];i.enabled&&(t.uniform2f(this.locations.u_line_scale,i.scale[0],i.scale[1]),t.uniform2f(this.locations.u_line_offset,i.offset[0],i.offset[1]),t.uniform1f(this.locations.u_opacity,i.color[3]),t.lineWidth(i.thickness),t.drawArrays(t.LINE_STRIP,this.lineStarts[e],this.lineLengths[e]))}t.disableVertexAttribArray(this.locations.a_position),t.disableVertexAttribArray(this.locations.a_color),t.bindBuffer(t.ARRAY_BUFFER,null),t.useProgram(null)};getLineConfig(t){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for getLineConfig`);return}return this.linesConfig[t]}getGlobalScale(){return[this.globalScale[0],this.globalScale[1]]}getGlobalOffset(){return[this.globalOffset[0],this.globalOffset[1]]}}const it=r=>`#version 300 es
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
`,nt=`#version 300 es
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
`,A=0,B=16,R=32,N=48,b=4,y=4,ot=64,at=.7,I=1e-6;function W(r,t,e){const i=r.createShader(t);if(!i)throw new Error("Could not create shader object.");if(r.shaderSource(i,e),r.compileShader(i),!r.getShaderParameter(i,r.COMPILE_STATUS)){const n=r.getShaderInfoLog(i);throw r.deleteShader(i),new Error(`Shader compile error: ${n}
Source:
${e}`)}return i}function rt(r,t,e){const i=W(r,r.VERTEX_SHADER,t),n=W(r,r.FRAGMENT_SHADER,e),o=r.createProgram();if(!o)throw r.deleteShader(i),r.deleteShader(n),new Error("Could not create program object.");if(r.attachShader(o,i),r.attachShader(o,n),r.linkProgram(o),r.detachShader(o,i),r.detachShader(o,n),r.deleteShader(i),r.deleteShader(n),!r.getProgramParameter(o,r.LINK_STATUS)){const a=r.getProgramInfoLog(o);throw r.deleteProgram(o),new Error(`Program link error: ${a}`)}return o}class E{gl;prog;maxLines;pointsTexture;vao;vertexBuffer;locations;lineDataUBO;lineDataUBObindingPoint=0;lineDataStride=ot;lineDataArrayBuffer=new ArrayBuffer(0);lineDataView=new DataView(this.lineDataArrayBuffer);reusableFloat32Array4=new Float32Array(4);reusableInt32Array1=new Int32Array(1);globalTransformDirty=!0;totalVertexCount=0;numLines=0;totalValidPoints=0;pointsData=new Float32Array(0);texWidth=0;texHeight=0;lineOriginalNumPointsCache=[];lineStartIndexCache=[];lineEnabledStatus=[];sharpTurnCache=new Map;pointsHashCache=new Map;globalScale=[1,1];globalOffset=[0,0];logX=!1;logY=!1;constructor(t,e){this.gl=t,this.maxLines=Math.max(1,e);const i=it(this.maxLines),n=nt;try{this.prog=rt(this.gl,i,n)}catch(f){throw l.error(`Error creating main GL program: ${f}`),this.prog=null,f}this.gl.useProgram(this.prog),this.locations={uPointsTex:this.gl.getUniformLocation(this.prog,"uPointsTex"),uTexWidth:this.gl.getUniformLocation(this.prog,"uTexWidth"),uTexHeight:this.gl.getUniformLocation(this.prog,"uTexHeight"),uGlobalScale:this.gl.getUniformLocation(this.prog,"uGlobalScale"),uGlobalOffset:this.gl.getUniformLocation(this.prog,"uGlobalOffset"),uViewportSize:this.gl.getUniformLocation(this.prog,"uViewportSize"),uLogAxis:this.gl.getUniformLocation(this.prog,"uLogAxis")},this.locations.uPointsTex||l.warn("Main uniform 'uPointsTex' not found."),this.locations.uTexWidth||l.warn("Main uniform 'uTexWidth' not found."),this.locations.uTexHeight||l.warn("Main uniform 'uTexHeight' not found."),this.locations.uGlobalScale||l.warn("Main uniform 'uGlobalScale' not found."),this.locations.uGlobalOffset||l.warn("Main uniform 'uGlobalOffset' not found."),this.locations.uViewportSize||l.warn("Main uniform 'uViewportSize' not found.");const o="LineDataBlock",a=this.gl.getUniformBlockIndex(this.prog,o);if(a===this.gl.INVALID_INDEX?l.warn(`Main program: Uniform block '${o}' not found or not active.`):this.gl.uniformBlockBinding(this.prog,a,this.lineDataUBObindingPoint),this.locations.uPointsTex&&this.gl.uniform1i(this.locations.uPointsTex,0),this.lineDataUBO=this.gl.createBuffer(),!this.lineDataUBO)throw new Error("Failed to create UBO buffer.");if(this.pointsTexture=this.gl.createTexture(),!this.pointsTexture)throw new Error("Failed to create points texture.");if(this.vertexBuffer=this.gl.createBuffer(),!this.vertexBuffer)throw new Error("Failed to create vertex buffer.");if(this.vao=this.gl.createVertexArray(),!this.vao)throw new Error("Failed to create vertex array object.");this.gl.bindVertexArray(this.vao),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertexBuffer);const s=6*b;this.setupVertexAttributes([{name:"aLineId",size:1,offset:0*b},{name:"aIndex",size:1,offset:1*b},{name:"aIsBevel",size:1,offset:2*b},{name:"aBevelNormal",size:2,offset:3*b},{name:"aSide",size:1,offset:5*b}],s),this.gl.bindVertexArray(null),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.lineEnabledStatus=new Array(this.maxLines).fill(!1),this.lineOriginalNumPointsCache=new Array(this.maxLines).fill(0),this.lineStartIndexCache=new Array(this.maxLines).fill(0),this.setGlobalTransform(this.globalScale,this.globalOffset),this.gl.useProgram(null),this.gl.enable(this.gl.BLEND),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA)}initLines(t){const e=this.gl;if(!this.prog){l.error("Cannot initLines, main program not initialized.");return}t.length>this.maxLines&&(l.warn(`initLines: Attempted to initialize with ${t.length} lines, but maxLines is ${this.maxLines}. Truncating.`),t=t.slice(0,this.maxLines));const i=[];let n=0;this.totalValidPoints=0,this.lineOriginalNumPointsCache.fill(0),this.lineStartIndexCache.fill(0),this.lineEnabledStatus.fill(!1);for(let g=0;g<t.length;g++){const m=t[g],p=m.scale||[1,1],L=m.offset||[0,0],T=m.thickness===void 0?1:m.thickness,S=m.enabled===void 0?!0:m.enabled,P=m.points.length/2;if(P>=2){const D=i.length;i.push({lineObj:{...m,scale:p,offset:L,thickness:T,enabled:S},startIndex:n,numPoints:P,enabled:S}),this.lineOriginalNumPointsCache[D]=P,this.lineStartIndexCache[D]=n,this.lineEnabledStatus[D]=S,n+=P,this.totalValidPoints+=P}else l.warn(`initLines: Skipping line index ${g} with ${P} points.`)}if(this.numLines=i.length,this.numLines===0){this.totalVertexCount=0,this.totalValidPoints=0,this.pointsData=new Float32Array(0),e.activeTexture(e.TEXTURE0),this.pointsTexture&&(e.bindTexture(e.TEXTURE_2D,this.pointsTexture),e.texImage2D(e.TEXTURE_2D,0,e.RG32F,1,1,0,e.RG,e.FLOAT,new Float32Array([0,0]))),this.texWidth=1,this.texHeight=1;const g=this.maxLines*this.lineDataStride;this.lineDataArrayBuffer.byteLength!==g?(this.lineDataArrayBuffer=new ArrayBuffer(g),this.lineDataView=new DataView(this.lineDataArrayBuffer)):new Float32Array(this.lineDataArrayBuffer).fill(0),this.lineDataUBO&&(e.bindBuffer(e.UNIFORM_BUFFER,this.lineDataUBO),e.bufferData(e.UNIFORM_BUFFER,this.lineDataArrayBuffer,e.DYNAMIC_DRAW),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,this.lineDataUBObindingPoint,this.lineDataUBO)),this.vertexBuffer&&(e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferData(e.ARRAY_BUFFER,0,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null)),e.useProgram(this.prog),this.locations.uTexWidth&&e.uniform1i(this.locations.uTexWidth,this.texWidth),this.locations.uTexHeight&&e.uniform1i(this.locations.uTexHeight,this.texHeight),l.warn("initLines called with no valid lines. Renderer resources cleared/reset.");return}const o=new Float32Array(this.totalValidPoints*2);let a=0;for(const g of i){const m=g.lineObj.points;o.set(m,a),a+=m.length}const s=e.getParameter(e.MAX_TEXTURE_SIZE);this.texWidth=Math.min(Math.max(1,this.totalValidPoints),s),this.texHeight=Math.ceil(this.totalValidPoints/this.texWidth),this.texHeight>s&&(l.error("Required texture height exceeds MAX_TEXTURE_SIZE!"),this.texHeight=s);const f=this.texWidth*this.texHeight;this.pointsData.length<f*2?this.pointsData=new Float32Array(f*2):this.pointsData.fill(0,0,f*2),this.pointsData.set(o),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.pointsTexture),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage2D(e.TEXTURE_2D,0,e.RG32F,this.texWidth,this.texHeight,0,e.RG,e.FLOAT,this.pointsData);const d=6,u=(g,m)=>[g[0]-m[0],g[1]-m[1]],x=g=>{const m=Math.sqrt(g[0]*g[0]+g[1]*g[1]);return m>I?[g[0]/m,g[1]/m]:[0,0]},v=new Map;let F=0;for(let g=0;g<this.numLines;g++){const m=i[g],p=m.lineObj.points,L=m.numPoints,T=this.computeSharpTurns(g,p,L);v.set(g,T);for(let S=0;S<L;S++)S>0&&S<L-1&&T[S]?F+=4:F+=2}this.numLines>1&&(F+=(this.numLines-1)*4),this.totalVertexCount=F;const c=new Float32Array(this.totalVertexCount*d);let h=0;for(let g=0;g<this.numLines;g++){const m=i[g],p=m.lineObj.points,L=m.numPoints,T=v.get(g)||[];for(let S=0;S<L;S++)if(T[S]){const D=[p[S*2],p[S*2+1]],tt=[p[(S-1)*2],p[(S-1)*2+1]],et=[p[(S+1)*2],p[(S+1)*2+1]],G=x(u(D,tt)),k=x(u(et,D)),Y=[-G[1],G[0]],$=[-k[1],k[0]];c[h++]=g,c[h++]=S,c[h++]=1,c[h++]=Y[0],c[h++]=Y[1],c[h++]=-1,c[h++]=g,c[h++]=S,c[h++]=1,c[h++]=Y[0],c[h++]=Y[1],c[h++]=1,c[h++]=g,c[h++]=S,c[h++]=1,c[h++]=$[0],c[h++]=$[1],c[h++]=-1,c[h++]=g,c[h++]=S,c[h++]=1,c[h++]=$[0],c[h++]=$[1],c[h++]=1}else c[h++]=g,c[h++]=S,c[h++]=0,c[h++]=0,c[h++]=0,c[h++]=-1,c[h++]=g,c[h++]=S,c[h++]=0,c[h++]=0,c[h++]=0,c[h++]=1;if(g<this.numLines-1){const S=this.lineOriginalNumPointsCache[g]-1,P=0;c[h++]=g,c[h++]=S,c[h++]=0,c[h++]=0,c[h++]=0,c[h++]=1,c[h++]=g,c[h++]=S,c[h++]=0,c[h++]=0,c[h++]=0,c[h++]=1,c[h++]=g+1,c[h++]=P,c[h++]=0,c[h++]=0,c[h++]=0,c[h++]=-1,c[h++]=g+1,c[h++]=P,c[h++]=0,c[h++]=0,c[h++]=0,c[h++]=-1}}e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.bufferData(e.ARRAY_BUFFER,c,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,null);const _=this.maxLines*this.lineDataStride;this.lineDataArrayBuffer.byteLength!==_?(this.lineDataArrayBuffer=new ArrayBuffer(_),this.lineDataView=new DataView(this.lineDataArrayBuffer)):new Float32Array(this.lineDataArrayBuffer).fill(0);for(let g=0;g<this.numLines;g++){const m=i[g],p=m.lineObj,L=g*this.lineDataStride;this.lineDataView.setFloat32(L+A+0*b,p.scale[0],!0),this.lineDataView.setFloat32(L+A+1*b,p.scale[1],!0),this.lineDataView.setFloat32(L+A+2*b,p.offset[0],!0),this.lineDataView.setFloat32(L+A+3*b,p.offset[1],!0),this.lineDataView.setFloat32(L+B+0*b,p.color[0],!0),this.lineDataView.setFloat32(L+B+1*b,p.color[1],!0),this.lineDataView.setFloat32(L+B+2*b,p.color[2],!0),this.lineDataView.setFloat32(L+B+3*b,p.color[3],!0),this.lineDataView.setInt32(L+R+0*y,m.startIndex,!0),this.lineDataView.setInt32(L+R+1*y,m.enabled?m.numPoints:0,!0),this.lineDataView.setInt32(L+R+2*y,0,!0),this.lineDataView.setInt32(L+R+3*y,0,!0),this.lineDataView.setFloat32(L+N,p.thickness,!0)}e.bindBuffer(e.UNIFORM_BUFFER,this.lineDataUBO),e.bufferData(e.UNIFORM_BUFFER,this.lineDataArrayBuffer,e.DYNAMIC_DRAW),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,this.lineDataUBObindingPoint,this.lineDataUBO),e.useProgram(this.prog),this.locations.uTexWidth&&e.uniform1i(this.locations.uTexWidth,this.texWidth),this.locations.uTexHeight&&e.uniform1i(this.locations.uTexHeight,this.texHeight)}setGlobalTransform(t,e){(this.globalScale[0]!==t[0]||this.globalScale[1]!==t[1]||this.globalOffset[0]!==e[0]||this.globalOffset[1]!==e[1])&&(this.globalScale[0]=t[0],this.globalScale[1]=t[1],this.globalOffset[0]=e[0],this.globalOffset[1]=e[1],this.globalTransformDirty=!0)}getAllDataBounds(){return this._computeBoundsCPU()}getDataBounds(){return U(this.globalScale,this.globalOffset,this.logX,this.logY)}_computeBoundsCPU(){let t=1/0,e=-1/0,i=1/0,n=-1/0,o=!1;for(let a=0;a<this.numLines;a++)if(this.lineEnabledStatus[a]){const s=this.lineStartIndexCache[a],f=this.lineOriginalNumPointsCache[a];if(f>0){const d=new Float32Array(this.pointsData.buffer,s*8,f*2),u=M(d,this.logX,this.logY);if(!u.isValid){l.log(`_computeBoundsCPU: Skipping line ${a} - only ${u.validPointCount}/${u.totalPoints} (${(u.validRatio*100).toFixed(1)}%) points valid for log axes`);continue}o=!0;const x=Z(d,this.logX,this.logY);x&&(x.minX<t&&(t=x.minX),x.maxX>e&&(e=x.maxX),x.minY<i&&(i=x.minY),x.maxY>n&&(n=x.maxY))}}return o?!isFinite(t)||!isFinite(e)||!isFinite(i)||!isFinite(n)?(l.warn("_computeBoundsCPU: Resulting bounds NaN/Infinity."),null):{minX:t,maxX:e,minY:i,maxY:n,coordinateSpace:{x:this.logX?"log":"linear",y:this.logY?"log":"linear"}}:null}autoScale(){if(this.numLines===0)return l.warn("autoScale: No lines initialized."),null;let t=null;if(console.time("CPU Bounds Calculation"),t=this._computeBoundsCPU(),console.timeEnd("CPU Bounds Calculation"),!t)return l.warn("autoScale: No valid data bounds found. Setting global transform to default."),this.setGlobalTransform([1,1],[0,0]),null;const{minX:e,maxX:i,minY:n,maxY:o}=t,[a,s,f,d]=C(t);return l.log(`AutoScale Results: Bounds [${e.toFixed(3)}, ${i.toFixed(3)}], [${n.toFixed(3)}, ${o.toFixed(3)}] -> Global Scale: [${a.toFixed(4)}, ${s.toFixed(4)}], Offset: [${f.toFixed(4)}, ${d.toFixed(4)}]`),this.setGlobalTransform([a,s],[f,d]),t}computeSharpTurns(t,e,i){const n=`${i}_${e[0]}_${e[1]}_${e[i*2-2]}_${e[i*2-1]}`;if(this.sharpTurnCache.has(t)&&this.pointsHashCache.get(t)===n)return this.sharpTurnCache.get(t);const o=new Array(i).fill(!1);if(i>=3){const a=at;for(let s=1;s<i-1;s++){const f=e[(s-1)*2],d=e[(s-1)*2+1],u=e[s*2],x=e[s*2+1],v=e[(s+1)*2],F=e[(s+1)*2+1];let c=u-f,h=x-d,_=v-u,g=F-x;const m=c*c+h*h,p=_*_+g*g;if(m<I*I||p<I*I)continue;const L=Math.sqrt(m),T=Math.sqrt(p);c/=L,h/=L,_/=T,g/=T,c*_+h*g<a&&(o[s]=!0)}}return this.sharpTurnCache.set(t,o),this.pointsHashCache.set(t,n),o}setupVertexAttributes(t,e){const i=this.gl;for(const n of t){const o=i.getAttribLocation(this.prog,n.name);o===-1?l.warn(`Attribute '${n.name}' not found in main program.`):(i.enableVertexAttribArray(o),i.vertexAttribPointer(o,n.size,i.FLOAT,!1,e,n.offset))}}updateUBOData(t,e){const i=this.gl;if(!(!this.lineDataUBO||t.length!==e.length)){i.bindBuffer(i.UNIFORM_BUFFER,this.lineDataUBO);for(let n=0;n<t.length;n++)i.bufferSubData(i.UNIFORM_BUFFER,t[n],e[n]);i.bindBuffer(i.UNIFORM_BUFFER,null)}}updateLinesTransform(t,e,i){if(!this.lineDataUBO){l.warn("updateLinesTransform: UBO not available.");return}const n=[],o=[];for(const a of t){if(a<0||a>=this.numLines){l.warn(`updateLinesTransform: Invalid lineId ${a}.`);continue}const s=a*this.lineDataStride+A;this.lineDataView.setFloat32(s+0*b,e[0],!0),this.lineDataView.setFloat32(s+1*b,e[1],!0),this.lineDataView.setFloat32(s+2*b,i[0],!0),this.lineDataView.setFloat32(s+3*b,i[1],!0);const f=new Float32Array(this.lineDataArrayBuffer,s,4);n.push(s),o.push(f)}n.length>0&&this.updateUBOData(n,o)}updateLineTransform(t,e,i){this.updateLinesTransform([t],e,i)}updateLineColor(t,e){if(t<0||t>=this.numLines){l.warn(`updateLineColor: Invalid lineId ${t}`);return}if(!this.lineDataUBO){l.warn("updateLineColor: UBO not available.");return}const i=t*this.lineDataStride+B;this.lineDataView.setFloat32(i+0*b,e[0],!0),this.lineDataView.setFloat32(i+1*b,e[1],!0),this.lineDataView.setFloat32(i+2*b,e[2],!0),this.lineDataView.setFloat32(i+3*b,e[3],!0),this.reusableFloat32Array4.set(e),this.updateUBOData([i],[this.reusableFloat32Array4])}updateLineThickness(t,e){if(t<0||t>=this.numLines){l.warn(`updateLineThickness: Invalid lineId ${t}`);return}if(!this.lineDataUBO){l.warn("updateLineThickness: UBO not available.");return}const i=t*this.lineDataStride+N;this.lineDataView.setFloat32(i,e,!0),this.reusableFloat32Array4[0]=e,this.updateUBOData([i],[this.reusableFloat32Array4.subarray(0,1)])}setLinesEnabled(t,e){if(!this.lineDataUBO){l.warn("setLinesEnabled: UBO not available.");return}const i=[];for(const n of t){if(n<0||n>=this.numLines){l.warn(`setLinesEnabled: Invalid lineId ${n}.`);continue}if(this.lineEnabledStatus[n]!==e){this.lineEnabledStatus[n]=e;const o=e?this.lineOriginalNumPointsCache[n]:0,a=n*this.lineDataStride+R+1*y;this.lineDataView.setInt32(a,o,!0),i.push({byteOffset:a,numPoints:o})}}if(i.length>0){const n=[],o=[];for(const a of i)this.reusableInt32Array1[0]=a.numPoints,n.push(a.byteOffset),o.push(this.reusableInt32Array1.slice());this.updateUBOData(n,o)}}setLineEnabled(t,e){this.setLinesEnabled([t],e)}setLogAxis(t,e){this.logX=t,this.logY=e}transformToLogSpace(t){if(!this.logX&&!this.logY)return l.log("transformToLogSpace: No log axes enabled, no scaling needed"),!0;let e;t?(e=t,l.log(`transformToLogSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)):(e=U(this.globalScale,this.globalOffset,this.logX,this.logY),l.log(`transformToLogSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));let i=e;e.coordinateSpace&&(this.logX&&e.coordinateSpace.x==="log"||this.logY&&e.coordinateSpace.y==="log")&&(l.log(`transformToLogSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`),i=V(e,e.coordinateSpace.x==="log",e.coordinateSpace.y==="log"),l.log(`transformToLogSpace: Linear bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`));const n=J(i,this.logX,this.logY);if(!n)return l.log("transformToLogSpace: Cannot transform bounds to log space"),!1;const[o,a,s,f]=C(n);return this.setGlobalTransform([o,a],[s,f]),l.log(`transformToLogSpace: Applied new transform - Scale[${o.toFixed(4)}, ${a.toFixed(4)}], Offset[${s.toFixed(4)}, ${f.toFixed(4)}]`),!0}transformToLinearSpace(t){let e;t?(e=t,l.log(`transformToLinearSpace: Using actual data bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`)):(e=U(this.globalScale,this.globalOffset,this.logX,this.logY),l.log(`transformToLinearSpace: Using transform-based bounds - X[${e.minX.toFixed(3)}, ${e.maxX.toFixed(3)}], Y[${e.minY.toFixed(3)}, ${e.maxY.toFixed(3)}]`));let i=e;e.coordinateSpace&&(e.coordinateSpace.x==="log"||e.coordinateSpace.y==="log")&&(l.log(`transformToLinearSpace: Converting bounds from coordinate space X:${e.coordinateSpace.x}, Y:${e.coordinateSpace.y} to linear`),i=V(e,e.coordinateSpace.x==="log",e.coordinateSpace.y==="log"),l.log(`transformToLinearSpace: Converted bounds - X[${i.minX.toFixed(3)}, ${i.maxX.toFixed(3)}], Y[${i.minY.toFixed(3)}, ${i.maxY.toFixed(3)}]`)),i.coordinateSpace={x:"linear",y:"linear"};const[n,o,a,s]=C(i);return this.setGlobalTransform([n,o],[a,s]),l.log(`transformToLinearSpace: Applied linear transform - Scale[${n.toFixed(4)}, ${o.toFixed(4)}], Offset[${a.toFixed(4)}, ${s.toFixed(4)}]`),!0}updateLineY(t,e){if(t<0||t>=this.numLines){l.warn(`updateLineY: Invalid lineId ${t}`);return}if(!this.pointsTexture){l.warn("updateLineY: pointsTexture is null.");return}const i=this.lineOriginalNumPointsCache[t];if(e.length!==i)throw new Error(`Line ${t}: Length mismatch for updateLineY. Expected ${i}, got ${e.length}.`);if(i<=0)return;const n=this.gl,o=this.lineStartIndexCache[t];for(let a=0;a<i;a++){const s=(o+a)*2+1;if(s<this.pointsData.length)this.pointsData[s]=e[a];else{l.error(`updateLineY: Index ${s} OOB length ${this.pointsData.length}.`);return}}if(n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,this.pointsTexture),i<=this.texWidth){const a=Math.floor(o/this.texWidth),s=o%this.texWidth;if(s+i<=this.texWidth){const f=o*2,d=i*2,u=new Float32Array(this.pointsData.buffer,this.pointsData.byteOffset+f*b,d);n.texSubImage2D(n.TEXTURE_2D,0,s,a,i,1,n.RG,n.FLOAT,u)}else this.updateTextureByRows(n,o,i)}else this.updateTextureByRows(n,o,i);n.bindTexture(n.TEXTURE_2D,null)}updateTextureByRows(t,e,i){let n=e;const o=e+i;for(;n<o;){const a=Math.floor(n/this.texWidth),s=n%this.texWidth,f=this.texWidth-s,d=o-n,u=Math.min(f,d);if(u<=0)break;const x=n*2,v=u*2,F=new Float32Array(this.pointsData.buffer,this.pointsData.byteOffset+x*b,v);t.texSubImage2D(t.TEXTURE_2D,0,s,a,u,1,t.RG,t.FLOAT,F),n+=u}}draw(){const t=this.gl;this.totalVertexCount===0||!this.prog||!this.vao||!this.pointsTexture||!this.lineDataUBO||(t.useProgram(this.prog),this.globalTransformDirty&&(this.locations.uGlobalScale&&t.uniform2f(this.locations.uGlobalScale,this.globalScale[0],this.globalScale[1]),this.locations.uGlobalOffset&&t.uniform2f(this.locations.uGlobalOffset,this.globalOffset[0],this.globalOffset[1]),this.globalTransformDirty=!1),this.locations.uViewportSize&&t.uniform2f(this.locations.uViewportSize,t.canvas.width,t.canvas.height),this.locations.uLogAxis&&t.uniform2f(this.locations.uLogAxis,this.logX?1:0,this.logY?1:0),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.pointsTexture),t.bindBufferBase(t.UNIFORM_BUFFER,this.lineDataUBObindingPoint,this.lineDataUBO),t.bindVertexArray(this.vao),t.drawArrays(t.TRIANGLE_STRIP,0,this.totalVertexCount),t.bindVertexArray(null),t.bindTexture(t.TEXTURE_2D,null),t.bindBufferBase(t.UNIFORM_BUFFER,this.lineDataUBObindingPoint,null),t.bindBuffer(t.UNIFORM_BUFFER,null),t.useProgram(null))}cleanup(){const t=this.gl;l.log("Cleaning up WebglLineThick resources..."),this.prog&&(t.deleteProgram(this.prog),this.prog=null),this.pointsTexture&&(t.deleteTexture(this.pointsTexture),this.pointsTexture=null),this.vertexBuffer&&(t.deleteBuffer(this.vertexBuffer),this.vertexBuffer=null),this.lineDataUBO&&(t.deleteBuffer(this.lineDataUBO),this.lineDataUBO=null),this.vao&&(t.deleteVertexArray(this.vao),this.vao=null),this.pointsData=new Float32Array(0),this.lineDataArrayBuffer=new ArrayBuffer(0),this.lineDataView=new DataView(this.lineDataArrayBuffer),this.numLines=0,this.totalVertexCount=0,this.totalValidPoints=0,this.lineOriginalNumPointsCache=[],this.lineStartIndexCache=[],this.lineEnabledStatus=[],this.sharpTurnCache.clear(),this.pointsHashCache.clear(),this.locations={uPointsTex:null,uTexWidth:null,uTexHeight:null,uGlobalScale:null,uGlobalOffset:null,uViewportSize:null,uLogAxis:null},this.globalScale=[1,1],this.globalOffset=[0,0],l.log("WebglLineThick resources cleaned up.")}getLineConfig(t){if(t<0||t>=this.numLines){l.warn(`Invalid lineId ${t} for getLineConfig`);return}if(!this.lineDataView||this.lineDataArrayBuffer.byteLength===0){l.warn("getLineConfig: Line data view or UBO not initialized.");return}const e=t*this.lineDataStride;if(e+N+b>this.lineDataView.byteLength){l.warn(`getLineConfig: lineId ${t} results in offset out of bounds for lineDataView.`);return}const i={};i.scale=[this.lineDataView.getFloat32(e+A+0*b,!0),this.lineDataView.getFloat32(e+A+1*b,!0)],i.offset=[this.lineDataView.getFloat32(e+A+2*b,!0),this.lineDataView.getFloat32(e+A+3*b,!0)],i.color=[this.lineDataView.getFloat32(e+B+0*b,!0),this.lineDataView.getFloat32(e+B+1*b,!0),this.lineDataView.getFloat32(e+B+2*b,!0),this.lineDataView.getFloat32(e+B+3*b,!0)],i.thickness=this.lineDataView.getFloat32(e+N,!0);const n=this.lineDataView.getInt32(e+R+1*y,!0);return i.enabled=n>0,i}getGlobalScale(){return[this.globalScale[0],this.globalScale[1]]}getGlobalOffset(){return[this.globalOffset[0],this.globalOffset[1]]}}class st{gl;maxLines;internalPlotter=null;constructor(t,e){this.gl=t,this.maxLines=e}initLines(t){if(!t||t.length===0){this.internalPlotter&&this.internalPlotter.initLines([]);return}let e=t[0].thickness;if(e===void 0&&(e=1),e<1&&(e=1),e<=1){this.internalPlotter instanceof w||(this.internalPlotter&&this.internalPlotter.cleanup(),this.internalPlotter=new w(this.gl,this.maxLines));const n=t.map(o=>({...o,thickness:1}));this.internalPlotter.initLines(n)}else this.internalPlotter instanceof E||(this.internalPlotter&&this.internalPlotter.cleanup(),this.internalPlotter=new E(this.gl,this.maxLines)),this.internalPlotter.initLines(t)}draw(){this.internalPlotter&&this.internalPlotter.draw()}cleanup(){this.internalPlotter&&(this.internalPlotter.cleanup(),this.internalPlotter=null)}updateLinePoints(t,e){this.internalPlotter instanceof w?this.internalPlotter.updateLinePoints(t,e):this.internalPlotter instanceof E?l.warn("updateLinePoints(xy) is not directly supported when WebglLineThick is active. Consider re-initializing the line with initLines() for full XY updates, or use updateLineY() if only Y values need changing and X values are stable."):l.warn("updateLinePoints: plotter not initialized.")}updateLineY(t,e){this.internalPlotter&&this.internalPlotter.updateLineY(t,e)}updateLineColor(t,e){this.internalPlotter&&this.internalPlotter.updateLineColor(t,e)}updateLineTransform(t,e,i){this.internalPlotter?this.internalPlotter.updateLineTransform(t,e,i):l.warn("updateLineTransform: plotter not initialized.")}updateLineThickness(t,e){this.internalPlotter instanceof E?this.internalPlotter.updateLineThickness(t,e):this.internalPlotter instanceof w&&(this.internalPlotter.updateLineThickness(t,1),l.warn("UnifiedLinePlot: WebglLinePlot is active, thickness forced to 1.0."))}setLineEnabled(t,e){this.internalPlotter&&this.internalPlotter.setLineEnabled(t,e)}setMultipleLinesEnabled(t,e){this.internalPlotter&&(this.internalPlotter instanceof w?this.internalPlotter.setMultipleLinesEnabled(t,e):this.internalPlotter instanceof E&&this.internalPlotter.setLinesEnabled(t,e))}updateMultipleLinesTransform(t,e,i){this.internalPlotter&&(this.internalPlotter instanceof w?this.internalPlotter.updateMultipleLinesTransform(t,e,i):this.internalPlotter instanceof E&&this.internalPlotter.updateLinesTransform(t,e,i))}setGlobalTransform(t,e){this.internalPlotter&&this.internalPlotter.setGlobalTransform(t,e)}autoScale(){return this.internalPlotter?this.internalPlotter.autoScale():null}getLineConfig(t){if(this.internalPlotter)return this.internalPlotter.getLineConfig(t)}getDataBounds(){return this.internalPlotter?this.internalPlotter.getDataBounds():null}getAllDataBounds(){return this.internalPlotter?this.internalPlotter.getAllDataBounds():null}setLogAxis(t,e){this.internalPlotter&&this.internalPlotter.setLogAxis(t,e)}transformToLogSpace(t){return this.internalPlotter?this.internalPlotter.transformToLogSpace(t):!1}transformToLinearSpace(t){return this.internalPlotter?this.internalPlotter.transformToLinearSpace(t):!1}getInternalPlotterType(){return this.internalPlotter instanceof w?"WebglLinePlot":this.internalPlotter instanceof E?"WebglLineThick":"null"}getGlobalScale(){return this.internalPlotter?this.internalPlotter.getGlobalScale():[1,1]}getGlobalOffset(){return this.internalPlotter?this.internalPlotter.getGlobalOffset():[0,0]}}class Q{r;g;b;a;constructor(t,e,i,n){this.r=t,this.g=e,this.b=i,this.a=n}toArray(){return[this.r,this.g,this.b,this.a]}}class lt{headIndex=0;color;squareSize;maxSquare;gl;squareIndices=new Uint16Array([0,1,2,2,1,3]);colorsBuffer;positionBuffer;prog;attrPosLocation;attrColorLocation;constructor(t,e){this.color=new Q(1,1,1,1),this.squareSize=.1,this.maxSquare=e,this.gl=t;const i=this.gl.createShader(this.gl.VERTEX_SHADER);if(!i)throw new Error("Unable to create vertex shader");this.gl.shaderSource(i,`#version 300 es

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

`),this.gl.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)||l.error(t.getShaderInfoLog(i)||"Vertex shader compilation failed");const n=t.createShader(t.FRAGMENT_SHADER);if(!n)throw new Error("Unable to create fragment shader");this.gl.shaderSource(n,`#version 300 es
    precision mediump float;

    //uniform vec4 u_color;
    in vec3 vColor;
    out vec4 outColor;

    void main() {
      outColor = vec4(vColor, 0.7);
    }
`),this.gl.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS)||l.error(t.getShaderInfoLog(n)||"Fragment shader compilation failed");const o=t.createProgram();this.gl.attachShader(o,i),this.gl.attachShader(o,n),this.gl.linkProgram(o),this.gl.useProgram(o),this.prog=o;const a=t.createBuffer();this.gl.bindBuffer(t.ELEMENT_ARRAY_BUFFER,a),this.gl.bufferData(t.ELEMENT_ARRAY_BUFFER,this.squareIndices,t.STATIC_DRAW);const s=new Float32Array(Array.from({length:this.maxSquare*2},()=>0));this.positionBuffer=t.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.positionBuffer),this.gl.bufferData(t.ARRAY_BUFFER,s,t.DYNAMIC_DRAW),this.attrPosLocation=t.getAttribLocation(this.prog,"position"),this.gl.vertexAttribPointer(this.attrPosLocation,2,t.FLOAT,!1,0,0),this.gl.vertexAttribDivisor(this.attrPosLocation,1),this.gl.enableVertexAttribArray(this.attrPosLocation);const f=new Uint8Array(Array.from({length:this.maxSquare*3},()=>255));this.colorsBuffer=t.createBuffer(),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.colorsBuffer),this.gl.bufferData(t.ARRAY_BUFFER,f,t.DYNAMIC_DRAW),this.attrColorLocation=t.getAttribLocation(this.prog,"sColor"),this.gl.vertexAttribPointer(this.attrColorLocation,3,this.gl.UNSIGNED_BYTE,!1,0,0),this.gl.vertexAttribDivisor(this.attrColorLocation,1),this.gl.enableVertexAttribArray(this.attrColorLocation),this.setScale(1,1),this.setOffset(0,0)}setColor(t){this.color=t;const e=this.gl.getUniformLocation(this.prog,"u_color");this.gl.uniform4f(e,t.r,t.g,t.b,t.a)}setSquareSize(t){this.squareSize=t;const e=this.gl.getUniformLocation(this.prog,"u_size");this.gl.uniform1f(e,this.squareSize)}setScale(t,e){const i=this.gl.getUniformLocation(this.prog,"u_scale");this.gl.uniformMatrix2fv(i,!1,[t,0,0,e])}setOffset(t,e){const i=this.gl.getUniformLocation(this.prog,"u_offset");this.gl.uniform2f(i,t,e)}addSquare(t,e){this.gl.useProgram(this.prog),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.positionBuffer),this.gl.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*2*4,t,0,t.length),this.gl.enableVertexAttribArray(this.attrPosLocation),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.colorsBuffer),this.gl.bufferSubData(this.gl.ARRAY_BUFFER,this.headIndex*3*1,e,0,e.length),this.gl.enableVertexAttribArray(this.attrColorLocation),this.headIndex=(this.headIndex+t.length/2)%this.maxSquare}draw(){this.gl.useProgram(this.prog),this.gl.drawElementsInstanced(this.gl.TRIANGLES,this.squareIndices.length,this.gl.UNSIGNED_SHORT,0,this.maxSquare)}}function ft(r,t){const e=t??(window.devicePixelRatio||1);r.width=r.clientWidth*e,r.height=r.clientHeight*e}function ht(r,t){const e={antialias:t?.antialias,alpha:t?.transparent??!1,desynchronized:t?.deSync,powerPreference:t?.powerPerformance,preserveDrawingBuffer:t?.preserveDrawing},i=r.getContext("webgl2",e);if(!i)throw new Error("WebGL2 is not supported or context creation failed");return i.viewport(0,0,r.width,r.height),i.enable(i.BLEND),i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA),i}function ct(r){const t=r.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)/);if(!t)throw new Error(`Invalid CSS color format: ${r}. Expected format: "rgba(r, g, b, a)" where r,g,b are 0-255 and a is 0-1`);const e=Math.max(0,Math.min(255,parseFloat(t[1])))/255,i=Math.max(0,Math.min(255,parseFloat(t[2])))/255,n=Math.max(0,Math.min(255,parseFloat(t[3])))/255,o=t[4]?Math.max(0,Math.min(1,parseFloat(t[4]))):1;return[e,i,n,o]}function z(r,t,e,i,n){let o;if(typeof t=="string")o=ct(t);else if(Array.isArray(t))o=t;else throw new Error("Invalid arguments. Use either CSS color string, color array, or individual RGBA values.");r.clearColor(o[0],o[1],o[2],o[3])}function ut(r,t){r.clear(r.COLOR_BUFFER_BIT)}function dt(r,t){ft(r,t?.devicePixelRatio);const e=ht(r,t);return t?.backgroundColor?z(e,t.backgroundColor):z(e,[0,0,0,1]),e}const X=[[.12,.47,.71,1],[1,.5,.05,1],[.17,.63,.17,1],[.84,.15,.16,1],[.58,.4,.74,1],[.55,.34,.29,1]];function gt(r){if(r instanceof HTMLCanvasElement)return r;if(typeof r=="string"){const e=document.getElementById(r);if(!(e instanceof HTMLCanvasElement))throw new Error(`plot: no <canvas> element found with id "${r}"`);return e}const t=document.createElement("canvas");return t.width=800,t.height=600,document.body.appendChild(t),t}function q(r,t,e){if(e){if(e[0]===e[1])throw new Error(`plot: ${t}-range must span a non-zero interval`);return e}let i=1/0,n=-1/0;for(const o of r){const a=o[t];for(let s=0;s<a.length;s++){const f=a[s];f<i&&(i=f),f>n&&(n=f)}}if(!isFinite(i)||!isFinite(n))throw new Error(`plot: cannot compute ${t}-range from empty data`);return i===n&&(i-=1,n+=1),[i,n]}function j(r,t,e){if(r.x.length!==r.y.length)throw new Error("plot: series x and y must have the same length");const i=t[1]-t[0],n=e[1]-e[0],o=new Float32Array(r.x.length*2);for(let a=0;a<r.x.length;a++)o[a*2]=(r.x[a]-t[0])/i*2-1,o[a*2+1]=(r.y[a]-e[0])/n*2-1;return o}function K(r,t,e){const i=r.type??"line";if(i!=="line"&&i!=="scatter")throw new Error(`plot: unsupported type "${String(i)}"`);const n=Array.isArray(r.data)?r.data:[r.data];if(n.length===0)throw new Error("plot: data must contain at least one series");const o=q(n,"x",r["x-range"]),a=q(n,"y",r["y-range"]);let s,f;if(i==="line"){const d=new st(e,n.length);d.initLines(n.map((u,x)=>({points:j(u,o,a),color:u.color??X[x%X.length],thickness:u.thickness??1,enabled:!0}))),s=()=>d.draw(),f=()=>d.cleanup()}else{const d=n.reduce((x,v)=>x+v.x.length,0),u=new lt(e,d);u.setSquareSize((r.markerSize??8)/t.width),u.setColor(new Q(1,1,1,1));for(let x=0;x<n.length;x++){const v=n[x],F=j(v,o,a),c=v.color??X[x%X.length],h=new Uint8Array(v.x.length*3);for(let _=0;_<v.x.length;_++)h[_*3]=Math.round(c[0]*255),h[_*3+1]=Math.round(c[1]*255),h[_*3+2]=Math.round(c[2]*255);u.addSquare(F,h)}s=()=>u.draw(),f=()=>{}}return{xRange:o,yRange:a,draw:s,cleanup:f}}function mt(r){const t=gt(r.canvas),e=dt(t,{antialias:!0,backgroundColor:r.backgroundColor??[0,0,0,1]});let i={...r},n=K(i,t,e);const o=()=>{ut(e),n.draw()};o();const a={canvas:t,gl:e,xRange:n.xRange,yRange:n.yRange,update:s=>{const f={...i,...s,canvas:t},d=K(f,t,e);n.cleanup(),i=f,n=d,a.xRange=n.xRange,a.yRange=n.yRange,o()},redraw:o,destroy:()=>n.cleanup()};return a}function xt(r){const t=O.useRef(null),e=O.useRef(null);return O.useEffect(()=>{const i=t.current;i&&(e.current?e.current.update(r.config):e.current=mt({...r.config,canvas:i}))},[r.config]),O.useEffect(()=>()=>{e.current?.destroy(),e.current=null},[]),O.createElement("canvas",{ref:t,width:r.width??800,height:r.height??600,style:r.style,className:r.className})}exports.WebglPlotFigure=xt;
