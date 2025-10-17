/**
 * Canvas 2D rendering context and utilities
 * Provides explicit setup without global scope pollution
 */

export interface Canvas2DContext {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	r: number; // min(width, height)
}

export interface Canvas2DOptions {
	canvas?: HTMLCanvasElement;
	canvasSelector?: string;
	width?: number;
	height?: number;
}

/**
 * Initialize a 2D canvas context
 * @param options Configuration options for canvas setup
 * @returns Canvas2DContext object with canvas, ctx, and dimensions
 */
export function setupCanvas2D(options: Canvas2DOptions = {}): Canvas2DContext {
	const { canvasSelector = '#canvas', width: customWidth, height: customHeight } = options;

	let canvas = options.canvas;
	if (!canvas) {
		const element = document.querySelector<HTMLCanvasElement>(canvasSelector);
		if (!element) {
			throw new Error(`Canvas element not found with selector: ${canvasSelector}`);
		}
		canvas = element;
	}

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get 2D rendering context');
	}

	if (customWidth !== undefined) canvas.width = customWidth;
	if (customHeight !== undefined) canvas.height = customHeight;

	const width = canvas.width;
	const height = canvas.height;
	const r = Math.min(width, height);

	return {
		canvas,
		ctx,
		width,
		height,
		r,
	};
}

/**
 * Update canvas dimensions
 * @param context Canvas2DContext to update
 * @param width New width
 * @param height New height
 */
export function setCanvasSize(context: Canvas2DContext, width: number, height: number): void {
	context.canvas.width = width;
	context.canvas.height = height;
	context.width = width;
	context.height = height;
	context.r = Math.min(width, height);
}
