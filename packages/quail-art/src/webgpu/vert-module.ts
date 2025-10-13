import { makeShaderDataDefinitions } from 'webgpu-utils';
import './setup.js';
import { code } from './shaders/fs-vert.wgsl';
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
