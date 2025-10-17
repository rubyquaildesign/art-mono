import { makeShaderDataDefinitions } from 'webgpu-utils';
import { createPPPipelineAndLayouts } from './createPipeline.js';
import './setup.js';
const code = /* wgsl */ `
struct VertOut {
  @builtin(position) position:vec4f,
  @location(0) uv:vec2f
}
@group(0) @binding(0) var smplr: sampler;
@group(0) @binding(1) var input: texture_2d<f32>;
@fragment fn frag(vx: VertOut) -> @location(0) vec4f {
  return textureSample(input,smplr,vx.uv);
}`;
const copyModule = device.createShaderModule({
	code,
	label: 'copy-shader-module',
});

function createCopyPass(
	passName: string,
	inputView: GPUTextureView,
	outputFormat: GPUTextureFormat,
	defaultOutputTexture: GPUTextureView,
) {
	const { bindGroupLayouts, renderPipeline } = createPPPipelineAndLayouts(
		{
			codeModule: copyModule,
			dataDefinition: makeShaderDataDefinitions(code),
			entry: 'frag',
		},
		outputFormat,
		passName,
	);
	const sam = device.createSampler({
		minFilter: 'linear',
		magFilter: 'linear',
		mipmapFilter: 'linear',
	});
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
		],
	});
	return {
		renderPass: (enc: GPUCommandEncoder, target?: GPUTextureView) => {
			const pass = enc.beginRenderPass({
				label: `pass-${passName}`,
				colorAttachments: [
					{
						loadOp: 'clear',
						storeOp: 'store',
						view: target ?? defaultOutputTexture,
					},
				],
			});
			pass.setPipeline(renderPipeline);
			pass.setBindGroup(0, bindGroup);
			pass.draw(3);
			pass.end();
		},
	};
}

export { createCopyPass };
