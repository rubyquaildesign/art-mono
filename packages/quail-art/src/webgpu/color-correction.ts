import { type ArrayBufferViews, makeShaderDataDefinitions, makeStructuredView } from 'webgpu-utils';
import { createPPPipelineAndLayouts } from './createPipeline.js';
import { BufUsage } from './usage-enums.js';
import './setup.js';
const code = /* wgsl */ `struct VertOut {
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
}`;

const toneMapModule = device.createShaderModule({
	code,
	label: 'tonemap-shader-module',
});
// @enum {number}
const tonemapType = {
	clamp: 0,
	reinhard: 1,
	narkowicz: 2,
	hill: 3,
} as const;
export const tonemapTypes = [...(Object.keys(tonemapType) as Array<keyof typeof tonemapType>)];
export type UniformObject = {
	whitePoint: number;
	exposure: number;
	contrast: number;
	midPoint: number;
	brightness: number;
	saturation: number;
};
type TypedView<T extends Record<string, unknown>> = ArrayBufferViews & {
	set: (data: Partial<T>) => void;
};

export function createToneMapPass(
	passName: string,
	inputView: GPUTextureView,
	outputFormat: GPUTextureFormat,
	defaultOutputTexture: GPUTextureView | undefined,
	tonemapMethod: keyof typeof tonemapType,
	gammaCorrect = true,
) {
	const fragDataDefinitions = makeShaderDataDefinitions(code);
	const uniforms = makeStructuredView(fragDataDefinitions.uniforms.u) as TypedView<UniformObject>;
	uniforms.set({
		whitePoint: 1.0,
		brightness: 0.0,
		contrast: 1.0,
		saturation: 1.0,
		exposure: 1.0,
		midPoint: 0.5,
	});
	const uniformBuffer = device.createBuffer({
		size: uniforms.arrayBuffer.byteLength,
		usage: BufUsage.UNIFORM | BufUsage.COPY_DST,
		label: `uniform-${passName}`,
	});
	const sam = device.createSampler({
		minFilter: 'linear',
		magFilter: 'linear',
		mipmapFilter: 'linear',
	});
	const { bindGroupLayouts, renderPipeline } = createPPPipelineAndLayouts(
		{
			codeModule: toneMapModule,
			dataDefinition: fragDataDefinitions,
			entry: 'frag',
			constants: {
				hdrType: tonemapType[tonemapMethod],
				gammaCorrect: gammaCorrect ? 1 : 0,
			},
		},
		outputFormat,
		passName,
	);
	const bindGroup = device.createBindGroup({
		layout: bindGroupLayouts[0],
		entries: [
			{
				binding: 0,
				resource: sam,
			},
			{
				binding: 1,
				resource: inputView,
			},
			{
				binding: 2,
				resource: {
					buffer: uniformBuffer,
				},
			},
		],
	});
	return {
		setUniforms: (queue: GPUQueue, uniformsToSet: Partial<UniformObject>) => {
			uniforms.set(uniformsToSet);
			queue.writeBuffer(uniformBuffer, 0, uniforms.arrayBuffer, 0);
		},
		renderPass: (enc: GPUCommandEncoder, target?: GPUTextureView) => {
			if (target || defaultOutputTexture) {
				const pass = enc.beginRenderPass({
					label: `pass-${passName}`,
					colorAttachments: [
						{
							loadOp: 'clear',
							storeOp: 'store',
							view: (target ?? defaultOutputTexture) as GPUTextureView,
						},
					],
				});
				pass.setPipeline(renderPipeline);
				pass.setBindGroup(0, bindGroup);
				pass.draw(3);
				pass.end();
			}
		},
	};
}
