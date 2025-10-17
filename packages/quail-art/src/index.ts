/**
 * @rubyquail-art/quail-art
 * A creative coding library for generative art
 *
 * This is the main entry point that exports all public APIs.
 * For global scope injection (creative coding convenience), import from 'creative-coding.js'
 */

// Core utilities (Vec, Matrix, color, etc.)
export * from './core/index.js';
export * as core from './core/index.js';

// Mathematical utilities (alias for core + geometry math)
export * as maths from './core/maths.js';
export * as m from './core/maths.js'; // short alias

// Color utilities
export * as colour from './core/colour.js';
export * as c from './core/colour.js'; // short alias

// Geometry and drawing utilities (namespace only to avoid conflicts)
export * as geometry from './geometry/index.js';
export * as draw from './geometry/draw.js';
export * as d from './geometry/draw.js'; // short alias

// Export specific geometry functions without conflicts
export { drawLoop, drawShape, drawLine, drawDot, drawBezierLoop, drawBezierShape } from './geometry/draw.js';
export { bSpline, bsplineMat } from './geometry/path.js';

// Canvas 2D rendering
export * from './canvas/index.js';
export * as canvas from './canvas/index.js';

// WebGPU rendering
export * from './webgpu/index.js';
export * as webgpu from './webgpu/index.js';

// Commonly used re-exports
export { Vec } from './core/vec.js';
export { Matrix } from './core/matrices.js';
export type { Canvas2DContext, Canvas2DOptions } from './canvas/setup.js';
export type { WebGPUDevice, WebGPUContext, WebGPUSetupOptions } from './webgpu/context-setup.js';
