/**
 * Canvas 2D Creative Coding Setup
 *
 * This module sets up a 2D canvas with global scope injection for creative coding.
 * This is the replacement for the old canvas/canvas.ts
 *
 * @example
 * ```typescript
 * import '@rubyquail-art/quail-art/canvas/creative-coding';
 * // Now you have: canvas, ctx, width, height, r as globals
 * ```
 */

import '../creative-coding.js';
import * as draw from '../geometry/draw.js';
import { setupCanvas2D } from './setup.js';

// Setup canvas with defaults
const canvasContext = setupCanvas2D();

const globalExports = {
	...canvasContext,
	d: draw,
} as const;

// Inject into global scope
Object.entries(globalExports).forEach(([key, value]) => {
	(globalThis as any)[key] = value;
});

// TypeScript global declarations
declare global {
	/* eslint-disable no-var */
	var canvas: HTMLCanvasElement;
	var ctx: CanvasRenderingContext2D;
	var width: number;
	var height: number;
	var r: number;
	var d: typeof draw;
	/* eslint-enable no-var */
}

/**
 * Update canvas size and global dimensions
 */
export function setSize(newWidth: number, newHeight: number): void {
	canvasContext.canvas.width = newWidth;
	canvasContext.canvas.height = newHeight;
	canvasContext.width = newWidth;
	canvasContext.height = newHeight;
	canvasContext.r = Math.min(newWidth, newHeight);

	// Update globals
	globalThis.width = newWidth;
	globalThis.height = newHeight;
	globalThis.r = canvasContext.r;
}

// Export the context for advanced usage
export { canvasContext };
