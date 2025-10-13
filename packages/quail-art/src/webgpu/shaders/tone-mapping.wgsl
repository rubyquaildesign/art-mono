struct VertOut {
  @builtin(position) position:vec4f,
  @location(0) uv:vec2f
}

override hdrType:u32 = 0u;
override gammaCorrect: bool = true;
fn lum(col: vec3f) -> f32 {
  return dot(col,vec3(0.299,0.587,0.114));
}


fn reinhardX(col:vec3f, wp:f32) -> vec3f {
  let lIn = lum(col);
  let lOut = (
      lIn * (
        1.0 + lIn / (wp * wp)
      )
    ) / (
      1.0 + lIn
    );
  let cOut = col / lIn * lOut;
  return saturate(cOut);
}

const acesInputMat = mat3x3<f32>(
  0.59719, 0.35458, 0.04823,
  0.07600, 0.90834, 0.01566,
  0.02840, 0.13383, 0.83777
);

const acesOutputMat = mat3x3<f32>(
  1.60475, -0.53108, -0.07367,
  -0.10208,  1.10813, -0.00605,
  -0.00327, -0.07276,  1.07602
);


fn RRTAndODTFit(v: vec3f) -> vec3f {
  let a = v * (v + 0.0245786) - 0.000090537;
  let b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}

fn narkACES(col:vec3f) -> vec3f {
  let cOut = (
    col * (
      2.51 * col + 0.03
      )
    ) / (
      col * (
        2.43 * col + 0.59
      ) + 0.14 );
  return saturate(cOut);
}

fn hillACES(col:vec3f) -> vec3f {
  var color = col;
  color = acesInputMat * color;
  color = RRTAndODTFit(color);
  return saturate(acesOutputMat * color);
}

struct Uniforms {
  whitePoint:f32,
  exposure:f32,
  contrast:f32,
  midPoint:f32,
  brightness:f32,
  saturation:f32,

}

@group(0) @binding(0) var smplr: sampler;
@group(0) @binding(1) var input: texture_2d<f32>;
@group(0) @binding(2) var<uniform> u: Uniforms;
@fragment fn frag(vx: VertOut) -> @location(0) vec4f {
  let inputTexel =  textureSample(input,smplr,vx.uv);
  var color = inputTexel.rgb;
  let blackPoint = vec3f(0f);
  color = max(blackPoint, color * u.exposure);
  color = max(blackPoint, u.contrast * (color - u.midPoint) + u.midPoint + u.brightness);
  color = max(blackPoint, mix(vec3(lum(color)),color,u.saturation));
  if hdrType == 1u {
    color = reinhardX(color,u.whitePoint);
  } else if hdrType == 2u {
    color = narkACES(color);
  } else if hdrType == 3u {
    color = hillACES(color);
  } else {
    color = saturate(color);
  }
  if gammaCorrect {
    color = pow(color,vec3(1.0/2.2));
  }
  return vec4(color,1.0);
}