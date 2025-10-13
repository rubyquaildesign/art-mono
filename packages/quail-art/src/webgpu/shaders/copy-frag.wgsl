struct VertOut {
  @builtin(position) position:vec4f,
  @location(0) uv:vec2f
}
@group(0) @binding(0) var smplr: sampler;
@group(0) @binding(1) var input: texture_2d<f32>;
@fragment fn frag(vx: VertOut) -> @location(0) vec4f {
  return textureSample(input,smplr,vx.uv);
}