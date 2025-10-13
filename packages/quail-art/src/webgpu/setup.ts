import '../entry/main.js';
const gpuTools = await setup();
type gpuTools = typeof gpuTools;
/* eslint-disable no-var */
declare global {
  var TU: typeof GPUTextureUsage;
  var BU: typeof GPUBufferUsage;
  var { adapter, device, presentationFormat, queue }: gpuTools;
}
globalThis.TU = GPUTextureUsage;
globalThis.BU = GPUBufferUsage;
Object.assign(globalThis, gpuTools);

async function setup() {
  if (!(navigator.gpu && navigator.gpu.requestAdapter)) {
    alert('browser does not support WebGPU');
    throw new Error('no adapter found');
  }
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance',
  });
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  if (!adapter) {
    alert('browser does not support WebGPU');
    throw new Error('no adapter found');
  }
  const device = await adapter.requestDevice({
    requiredFeatures: ['bgra8unorm-storage'],
  });
  return { device, presentationFormat, adapter, queue: device.queue };
}
