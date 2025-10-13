/* generated via tgpu-gen by TypeGPU */
import tgpu from 'typegpu';
import * as d from 'typegpu/data';

/* structs */
export const Vary = d.struct({
  position: d.vec4f,
  uv: d.location(0, d.vec2f),
});

export const Uniforms = d.struct({
  threshold: d.f32,
  soft: d.f32,
});

/* bindGroupLayouts */
export const layout0 = tgpu.bindGroupLayout({
  sam: {
    sampler: 'filtering',
  },
  original: {
    texture: 'float',
  },
  u: {
    uniform: Uniforms,
  },
});

/* functions */
export const preFilter = tgpu.fn([d.vec3f, d.f32, d.f32], d.vec3f)(/* wgsl */ `(c:vec3f, t:f32, sT:f32) -> vec3f {
  let brightness = max(c.r,max(c.g,c.b));
  let knee = t * sT;
  var soft = brightness - t + knee;
  soft = clamp(soft,0.0,2.0 * knee);
  soft = soft * soft / (4.0 * knee + 0.00001);
  var contribution = max(soft, brightness - t);
  contribution /= max(brightness,0.00001);
  return c * contribution;
}`);
