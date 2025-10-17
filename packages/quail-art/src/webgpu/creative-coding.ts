/**
 * WebGPU Creative Coding Setup
 *
 * This module sets up WebGPU with global scope injection for creative coding.
 * This is the replacement for the old webgpu/webgpu.ts and webgpu/setup.ts
 *
 * @example
 * ```typescript
 * import '@rubyquail-art/quail-art/webgpu/creative-coding';
 * // Now you have: device, adapter, canvas, ctx, width, height, etc. as globals
 * ```
 */

/// <reference types="@webgpu/types" />

import '../creative-coding.js';
import { setupWebGPUCanvas, resizeWebGPUCanvas } from './context-setup.js';

// Setup WebGPU with defaults (top-level await)
const gpuContext = await setupWebGPUCanvas();

const globalExports = {
	// Device and adapter
	adapter: gpuContext.adapter,
	device: gpuContext.device,
	queue: gpuContext.queue,
	presentationFormat: gpuContext.presentationFormat,

	// Canvas and context
	canvas: gpuContext.canvas,
	ctx: gpuContext.context,

	// Dimensions
	width: gpuContext.width,
	height: gpuContext.height,
	r: gpuContext.r,

	// Render targets
	renderTarget: gpuContext.renderTarget,
	renderTargetView: gpuContext.renderTargetView,
	depthTexture: gpuContext.depthTexture,
	depthTargetView: gpuContext.depthTargetView,

	// Usage enums for convenience
	TU: GPUTextureUsage,
	BU: GPUBufferUsage,
} as const;

// Inject into global scope
Object.entries(globalExports).forEach(([key, value]) => {
	(globalThis as any)[key] = value;
});

// TypeScript global declarations
declare global {
	/* eslint-disable no-var */
	var adapter: GPUAdapter;
	var device: GPUDevice;
	var queue: GPUQueue;
	var presentationFormat: GPUTextureFormat;
	var canvas: HTMLCanvasElement;
	var width: number;
	var height: number;
	var r: number;
	var renderTarget: GPUTexture;
	var renderTargetView: GPUTextureView;
	var depthTexture: GPUTexture;
	var depthTargetView: GPUTextureView;
	var TU: typeof GPUTextureUsage;
	var BU: typeof GPUBufferUsage;
	/* eslint-enable no-var */
}

/**
 * Resize canvas and update globals
 */
export function resizeForDisplay(newWidth: number, newHeight: number): boolean {
	const oldWidth = gpuContext.width;
	const oldHeight = gpuContext.height;

	resizeWebGPUCanvas(gpuContext, newWidth, newHeight);

	// Update globals
	globalThis.width = gpuContext.width;
	globalThis.height = gpuContext.height;
	globalThis.r = gpuContext.r;
	globalThis.renderTarget = gpuContext.renderTarget;
	globalThis.renderTargetView = gpuContext.renderTargetView;
	globalThis.depthTexture = gpuContext.depthTexture;
	globalThis.depthTargetView = gpuContext.depthTargetView;

	return oldWidth !== gpuContext.width || oldHeight !== gpuContext.height;
}

// Export the context for advanced usage
export { gpuContext };
