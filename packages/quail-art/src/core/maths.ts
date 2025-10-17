// Mathematical utilities
export * from './matrices.js';
export * from './vec.js';
export * from './xy-point-helpers.js';
export * from '../geometry/line.js';
export * from '../geometry/djikstra.js';
export * from '../geometry/pg.js';
export * from '../geometry/path.js';

export function mod(diviend: number, divisor: number) {
	const quotiont = Math.floor(diviend / divisor);
	return diviend - divisor * quotiont;
}
