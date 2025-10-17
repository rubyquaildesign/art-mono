import { newTex, TexUse } from './resources';

export abstract class Pass {}
export class PassComposer {
	device: GPUDevice;
	targetTexture: GPUTexture;
	textureA: GPUTexture;
	textureB: GPUTexture;
	queue: GPUQueue;
	constructor(
		device: GPUDevice,
		queue: GPUQueue,
		target: GPUTexture,
		workingFormat: GPUTextureFormat = 'rgba16float',
		label = 'Pass Composer',
	) {
		this.device = device;
		this.queue = queue;
		this.targetTexture = target;
		this.textureA = newTex(
			`${label} textureA`,
			{
				width: target.width,
				height: target.height,
			},
			workingFormat,
			new TexUse().bindable.renderTarget.v,
			'2d',
			{},
			device,
		);
		this.textureB = newTex(
			`${label} textureB`,
			{
				width: target.width,
				height: target.height,
			},
			workingFormat,
			new TexUse().bindable.renderTarget.v,
			'2d',
			{},
			device,
		);
	}
}
