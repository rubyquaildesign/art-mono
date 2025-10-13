import {
	makeBindGroupLayoutDescriptors,
	type ShaderDataDefinitions,
} from 'webgpu-utils';
import './setup.js';
import { fsPipelineVertState, vertDefinitions } from './vert-module.js';
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export function createPPPipelineAndLayouts(
	fragData: {
		codeModule: GPUShaderModule;
		dataDefinition: ShaderDataDefinitions;
		entry: string;
		constants?: Record<string, number>;
	},
	outputFormat: GPUTextureFormat,
	pipelineLabel: string,
) {
	const rpDescriptor: Optional<GPURenderPipelineDescriptor, 'layout'> = {
		vertex: fsPipelineVertState,
		fragment: {
			module: fragData.codeModule,
			targets: [{ format: outputFormat }],
			entryPoint: fragData.entry,
			constants: fragData.constants ?? {},
		},
		label: pipelineLabel,
	};
	const bindGroupLayoutDescriptors = makeBindGroupLayoutDescriptors(
		[vertDefinitions, fragData.dataDefinition],
		rpDescriptor,
	);
	const bindGroupLayouts = bindGroupLayoutDescriptors.map((bgld) =>
		device.createBindGroupLayout(bgld),
	);
	const renderPipelineLayout = device.createPipelineLayout({
		bindGroupLayouts,
	});
	const renderPipeline = device.createRenderPipeline({
		...rpDescriptor,
		layout: renderPipelineLayout,
	});
	return { renderPipeline, bindGroupLayouts };
}
