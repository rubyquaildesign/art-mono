fn downsample(uv: vec2f, hP: vec2f, tex: texture_2d<f32>, sam: sampler) -> vec4f {
	var sum = textureSample(tex, sam, uv + vec2f(hP.x,-hP.y)) * 4.0;

	sum += textureSample(tex, sam, uv - hP.xy);
	sum += textureSample(tex, sam, uv + hP.xy);
	sum += textureSample(tex, sam, uv + vec2f(hP.x, -hP.y));
	sum += textureSample(tex, sam, uv - vec2f(hP.x, -hP.y));
	return sum / 8.0;
}
struct Uniforms {
  intensity:f32,
  blurOffset:f32,
}
@group(1) @binding(0) var sourceTexture: texture_2d<f32>;
@group(1) @binding(1) var sam: sampler;
@group(1) @binding(2) var<uniform> u:Uniforms;

fn upsample(uv: vec2f, rHP: vec2f, tex: texture_2d<f32>, sam: sampler) -> vec4f {
  let hP = rHP * u.blurOffset;
	var sum = textureSample(tex, sam, uv + vec2f(-hP.x * 2.0, 0.0));
	sum += textureSample(tex, sam, uv + vec2f(-hP.x, hP.y)) * 2.0;
	sum += textureSample(tex, sam, uv + vec2f(0.0, hP.y * 2.0));
	sum += textureSample(tex, sam, uv + vec2f(hP.x, hP.y)) * 2.0;
	sum += textureSample(tex, sam, uv + vec2f(hP.x * 2.0, 0.0));
	sum += textureSample(tex, sam, uv + vec2f(hP.x,-hP.y)) * 2.0;
	sum += textureSample(tex, sam, uv + vec2f(0.0, -hP.y * 2.0));
	sum += textureSample(tex, sam, uv + vec2f(-hP.x,-hP.y)) * 2.0;
	var result = sum / 12.0;
	return result;
}

override downpass: bool = true;


@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var<uniform> hp: vec2f;
override finalPass: bool = false;
struct Vary {
  @builtin(position) position:vec4f,
  @location(0) uv:vec2f
}

@fragment fn frag(inp: Vary) -> @location(0) vec4f {
  if downpass {
    return downsample(inp.uv,hp,tex,sam);
  } else {
  	let blur = upsample(inp.uv,hp,tex,sam);
    if finalPass {
      let source = textureSample(sourceTexture,sam,inp.uv).rgb;
      return vec4f(source + (u.intensity * blur.rgb),1.0);
    }
    return blur;
  }
}