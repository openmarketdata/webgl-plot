/*****************
 * The shaders in the file are WebglLneThick.ts
 * They are used for rendering thick lines in WebGL.
 *
 * ZOOM THICKNESS ISSUE NOTES:
 * - Problem: Line thickness changes during zoom operations (X-only zoom especially problematic)
 * - Root cause: Thickness offset calculations need to be independent of global scale transforms
 * - Current approach: Calculate thickness in screen space after considering global scale impact on normals
 * - Key insight: Transform normals by global scale, then apply constant screen-space thickness
 * - Apply thickness offset AFTER global transform to maintain constant pixel thickness
 *
 * Changes made:
 * 1. calculateThicknessOffset() now takes globalScale parameter
 * 2. Normal vectors are transformed by globalScale before thickness calculation
 * 3. Thickness offset applied after global transform (not before)
 * 4. This ensures visual thickness remains constant regardless of zoom level
 ******************/
export declare const VERTEX_SHADER_SOURCE: (maxLines: number) => string;
export declare const FRAGMENT_SHADER_SOURCE = "#version 300 es\nprecision mediump float;\nflat in vec4 vColor; // Use 'flat' for no interpolation\nout vec4 fragColor;\nvoid main() {\n  // Optional: Discard fully transparent fragments early\n  if (vColor.a == 0.0) {\n    discard;\n  }\n  fragColor = vColor;\n}\n";
//# sourceMappingURL=ShadersThick.d.ts.map