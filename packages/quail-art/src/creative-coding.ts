/**
 * Creative Coding Convenience Module
 *
 * This module injects commonly used functions into the global scope for
 * creative coding convenience. Import this in your sketch if you want
 * p5.js-style global functions.
 *
 * @example
 * ```typescript
 * import '@rubyquail-art/quail-art/creative-coding';
 * // Now you can use: vec, sin, cos, random, etc. without imports
 * ```
 *
 * WARNING: This pollutes the global scope. For production code or libraries,
 * prefer explicit imports from the main package instead.
 */

import { Vec } from './core/vec.js';
import { range } from 'd3';
import * as colour from './core/colour.js';
import * as maths from './core/maths.js';
import * as D3 from 'd3';

const PI = Math.PI;
const TAU = Math.PI * 2;
const { random, floor, ceil, abs, atan2, sin, cos, tan, min, max, sqrt } = Math;

const globalExports = {
	// Math functions
	random,
	floor,
	ceil,
	abs,
	atan2,
	sin,
	cos,
	tan,
	min,
	max,
	sqrt,
	PI,
	TAU,

	// D3 utilities
	range,
	d3: D3,

	// Custom utilities
	vec: (x: number, y: number) => new Vec(x, y),
	lerp: Vec.lerp,
	r2d: Vec.rad2deg,
	d2r: Vec.deg2rad,

	// Module namespaces
	m: maths,
	c: colour,
} as const;

// Inject into global scope
Object.entries(globalExports).forEach(([key, value]) => {
	(globalThis as any)[key] = value;
});

// TypeScript global declarations
declare global {
	interface Window {
		/* eslint-disable no-var */
		random: typeof Math.random;
		floor: typeof Math.floor;
		ceil: typeof Math.ceil;
		abs: typeof Math.abs;
		atan2: typeof Math.atan2;
		sin: typeof Math.sin;
		cos: typeof Math.cos;
		tan: typeof Math.tan;
		min: typeof Math.min;
		max: typeof Math.max;
		sqrt: typeof Math.sqrt;
		PI: number;
		TAU: number;
		range: (start: number, stop?: number, step?: number) => number[];
		d3: typeof D3;
		vec: typeof globalExports.vec;
		lerp: typeof Vec.lerp;
		r2d: typeof Vec.rad2deg;
		d2r: typeof Vec.deg2rad;
		m: typeof maths;
		c: typeof colour;
	}
	/* eslint-enable no-var */
}

// Re-export for convenience
export {
	random,
	floor,
	ceil,
	abs,
	atan2,
	sin,
	cos,
	tan,
	min,
	max,
	sqrt,
	PI,
	TAU,
	range,
	D3 as d3,
	maths as m,
	colour as c,
};
