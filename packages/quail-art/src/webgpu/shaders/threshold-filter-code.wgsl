struct Vary {
  @builtin(position) position:vec4f,
  @location(0) uv:vec2f
}
struct Uniforms {
  threshold: f32,
  soft: f32,
}
@group(0) @binding(0) var sam: sampler;
@group(0) @binding(1) var original: texture_2d<f32>;
@group(0) @binding(2) var<uniform> u: Uniforms;

fn preFilter(c:vec3f, t:f32, sT:f32) -> vec3f {
  let brightness = max(c.r,max(c.g,c.b));
  let knee = t * sT;
  var soft = brightness - t + knee;
  soft = clamp(soft,0.0,2.0 * knee);
  soft = soft * soft / (4.0 * knee + 0.00001);
  var contribution = max(soft, brightness - t);
  contribution /= max(brightness,0.00001);
  return c * contribution;
}

@fragment fn frag_threshold(inp: Vary) -> @location(0) vec4f {
  var colorA = textureSample(original, sam, inp.uv);
  let color = colorA.rgb;
  return vec4f(preFilter(color,u.threshold,u.soft),1.0);
}
