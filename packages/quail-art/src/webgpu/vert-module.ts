import { makeShaderDataDefinitions } from 'webgpu-utils';
import './setup.js';
const code = /* wgsl */ `
struct VertOut {
  @builtin(position) position:vec4f,
  @location(0) uv:vec2f
}
@vertex fn vert(@builtin(vertex_index) ix:u32) -> VertOut {
  let tris = array<vec2f, 3>(
    vec2f(-1.0,3.0),
    vec2f(-1.0,-1.0),
    vec2f(3.0,-1.0)
  );
  let uvs = array(
    vec2f(0.0,-1.0),
    vec2f(0.0,1.0),
    vec2f(2.0,1.0)
  );
  return VertOut(vec4f(tris[ix],0.0,1.0),uvs[ix]);
}`;
const vertDefinitions = makeShaderDataDefinitions(code);
/** @description Shader Module for a fullscreen triangle
 *
 * Returns this struct
 * ```wgsl
 * struct VertOut {
 *   @builtin(position) position:vec4f,
 *   @location(0) uv:vec2f
 * }
 * ```
 */
const fsVertModule = device.createShaderModule({
	code: code,
	label: 'full-screen-vert-module',
});

/** @description Vertex State for a fullscreen triangle
 *
 * Returns this struct
 * ```wgsl
 * struct VertOut {
 *   @builtin(position) position:vec4f,
 *   @location(0) uv:vec2f
 * }
 * ```
 */
const fsPipelineVertState: GPUVertexState = {
	module: fsVertModule,
	entryPoint: 'vert',
};

export { fsVertModule, fsPipelineVertState, vertDefinitions };
