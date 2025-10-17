/**
 * WebGPU context and device setup
 * Provides explicit initialization without global scope pollution
 */

/// <reference types="@webgpu/types" />

export interface WebGPUDevice {
	adapter: GPUAdapter;
	device: GPUDevice;
	presentationFormat: GPUTextureFormat;
	queue: GPUQueue;
}

export interface WebGPUContext extends WebGPUDevice {
	canvas: HTMLCanvasElement;
	context: GPUCanvasContext;
	width: number;
	height: number;
	r: number; // min(width, height)
	renderTarget: GPUTexture;
	renderTargetView: GPUTextureView;
	depthTexture: GPUTexture;
	depthTargetView: GPUTextureView;
}

export interface WebGPUSetupOptions {
	canvas?: HTMLCanvasElement;
	canvasSelector?: string;
	width?: number;
	height?: number;
	powerPreference?: GPUPowerPreference;
	requiredFeatures?: GPUFeatureName[];
	sampleCount?: number;
}

/**
 * Initialize WebGPU device and adapter
 * @param options Configuration options
 * @returns WebGPU device context
 */
export async function setupWebGPU(
	options: Omit<WebGPUSetupOptions, 'canvas' | 'canvasSelector' | 'width' | 'height'> = {},
): Promise<WebGPUDevice> {
	const { powerPreference = 'high-performance', requiredFeatures = ['bgra8unorm-storage'] } = options;

	if (!navigator.gpu) {
		throw new Error('WebGPU is not supported in this browser');
	}

	const adapter = await navigator.gpu.requestAdapter({ powerPreference });
	if (!adapter) {
		throw new Error('Failed to get WebGPU adapter');
	}

	const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
	const device = await adapter.requestDevice({
		requiredFeatures: requiredFeatures as Iterable<GPUFeatureName>,
	});

	return {
		adapter,
		device,
		presentationFormat,
		queue: device.queue,
	};
}

/**
 * Initialize WebGPU with canvas context
 * @param options Configuration options including canvas
 * @returns Full WebGPU context with canvas and render targets
 */
export async function setupWebGPUCanvas(options: WebGPUSetupOptions = {}): Promise<WebGPUContext> {
	const { canvasSelector = '#canvas', width: customWidth, height: customHeight, sampleCount = 1 } = options;

	// Get or find canvas
	let canvas = options.canvas;
	if (!canvas) {
		const element = document.querySelector<HTMLCanvasElement>(canvasSelector);
		if (!element) {
			throw new Error(`Canvas element not found with selector: ${canvasSelector}`);
		}
		canvas = element;
	}

	// Setup WebGPU device
	const gpuDevice = await setupWebGPU(options);
	const { device, presentationFormat } = gpuDevice;

	// Configure canvas context
	const context = canvas.getContext('webgpu');
	if (!context) {
		throw new Error('Failed to get WebGPU canvas context');
	}

	context.configure({
		device,
		format: presentationFormat,
		alphaMode: 'opaque',
		colorSpace: 'srgb',
		usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
	});

	// Set dimensions
	if (customWidth !== undefined) canvas.width = customWidth;
	if (customHeight !== undefined) canvas.height = customHeight;

	const width = canvas.width;
	const height = canvas.height;
	const r = Math.min(width, height);

	// Create render targets
	const renderTarget = device.createTexture({
		size: [width, height],
		format: presentationFormat,
		sampleCount,
		usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
	});

	const depthTexture = device.createTexture({
		size: [width, height],
		format: 'depth24plus',
		sampleCount,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	});

	return {
		...gpuDevice,
		canvas,
		context,
		width,
		height,
		r,
		renderTarget,
		renderTargetView: renderTarget.createView(),
		depthTexture,
		depthTargetView: depthTexture.createView(),
	};
}

/**
 * Resize WebGPU canvas and recreate render targets
 * @param context WebGPU context to resize
 * @param width New width
 * @param height New height
 */
export function resizeWebGPUCanvas(context: WebGPUContext, width: number, height: number): void {
	const { device, presentationFormat, canvas, renderTarget, depthTexture } = context;

	// Clamp to device limits
	const clampedWidth = Math.max(1, Math.min(device.limits.maxTextureDimension2D, width));
	const clampedHeight = Math.max(1, Math.min(device.limits.maxTextureDimension2D, height));

	// Destroy old textures
	renderTarget.destroy();
	depthTexture.destroy();

	// Resize canvas
	canvas.width = clampedWidth;
	canvas.height = clampedHeight;

	// Recreate render targets
	const sampleCount = 1; // Could be parameterized
	const newRenderTarget = device.createTexture({
		size: [clampedWidth, clampedHeight],
		format: presentationFormat,
		sampleCount,
		usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
	});

	const newDepthTexture = device.createTexture({
		size: [clampedWidth, clampedHeight],
		format: 'depth24plus',
		sampleCount,
		usage: GPUTextureUsage.RENDER_ATTACHMENT,
	});

	// Update context
	context.width = clampedWidth;
	context.height = clampedHeight;
	context.r = Math.min(clampedWidth, clampedHeight);
	context.renderTarget = newRenderTarget;
	context.renderTargetView = newRenderTarget.createView();
	context.depthTexture = newDepthTexture;
	context.depthTargetView = newDepthTexture.createView();
}
