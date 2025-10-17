/**
 * WebGPU rendering module
 * Provides WebGPU setup, utilities, and rendering pipeline
 */

// Core setup
export * from './context-setup.js';
export type { WebGPUDevice, WebGPUContext, WebGPUSetupOptions } from './context-setup.js';

// Utilities and helpers
export * from './webgpu-utils.js';
export * from './resources.js';
export * from './usage-enums.js';
export * from './createPipeline.js';
export * from './vert-module.js';

// Post-processing and filters
export * from './blur-filter.js';
export * from './color-correction.js';
export * from './copy-pass.js';
export * from './post-processing.js';

// Re-export webgpu-utils if available
export * from 'webgpu-utils';
