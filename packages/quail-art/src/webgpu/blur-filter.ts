// import * as d3 from 'd3';
// import {
//   makeBindGroupLayoutDescriptors,
//   makeShaderDataDefinitions,
//   makeStructuredView,
//   setStructuredValues,
// } from 'webgpu-utils';
// import { code as kawaseCode } from './shaders/kawase.wgsl';
// import { code as filterCode } from './shaders/threshold-filter-code.wgsl';
// import { BufUsage, TexUsage } from './usage-enums.js';
// import { fsPipelineVertState, vertDefinitions } from './vert-module.js';

// const oneOneblend: GPUBlendState = {
//   alpha: {
//     operation: 'add',
//     dstFactor: 'one',
//     srcFactor: 'one',
//   },
//   color: {
//     operation: 'add',
//     dstFactor: 'one',
//     srcFactor: 'one',
//   },
// };
// /// <reference path="./global.d.ts" />
// export const buildBlur = (
//   device: GPUDevice,
//   resolution: [number, number],
//   levels: number,
//   destinationFormat: GPUTextureFormat,
//   sourceTexture: GPUTexture,
//   workingFormat: GPUTextureFormat = 'rgba16float',
//   bloom: boolean = false
// ) => {
//   const doBloom = bloom;
//   levels = Math.round(levels);
//   levels = Math.max(levels, 1);
//   const kawaseCodeModule = device.createShaderModule({
//     code: kawaseCode,
//   });
//   const kawaseDefinitions = makeShaderDataDefinitions(kawaseCode);
//   const thresholdCodeModule = device.createShaderModule({
//     code: filterCode,
//   });
//   const thresholdDefinitions = makeShaderDataDefinitions(filterCode);
//   const thresholdPipelineDescriptor = {
//     vertex: fsPipelineVertState,
//     label: 'thresholdPipeline',
//     fragment: {
//       module: thresholdCodeModule,
//       targets: [{ format: workingFormat }],
//       entryPoint: 'frag_threshold',
//     },
//   } satisfies Partial<GPURenderPipelineDescriptor>;
//   const downSamplePipelineDescriptor = {
//     vertex: fsPipelineVertState,
//     label: 'downSamplePipeline',
//     fragment: {
//       module: kawaseCodeModule,
//       targets: [{ format: workingFormat }],
//       entryPoint: 'frag',
//       constants: {
//         downpass: 1,
//         finalPass: 0,
//       },
//     },
//   } satisfies Partial<GPURenderPipelineDescriptor>;

//   const upSamplePipelineDescriptor = {
//     vertex: fsPipelineVertState,
//     label: 'upSamplePipeline',
//     fragment: {
//       module: kawaseCodeModule,
//       targets: [
//         { format: workingFormat, blend: doBloom ? oneOneblend : undefined },
//       ],
//       entryPoint: 'frag',
//       constants: {
//         downpass: 0,
//         finalPass: 0,
//       },
//     },
//   } satisfies Partial<GPURenderPipelineDescriptor>;
//   const finalPipelineDescriptor = {
//     vertex: fsPipelineVertState,
//     label: 'finalUpSamplePipeline',
//     fragment: {
//       module: kawaseCodeModule,
//       targets: [{ format: destinationFormat }],
//       entryPoint: 'frag',
//       constants: {
//         downpass: 0,
//         finalPass: doBloom ? 1 : 0,
//       },
//     },
//   } satisfies Partial<GPURenderPipelineDescriptor>;
//   const thresholdBGLayoutDescriptors = makeBindGroupLayoutDescriptors(
//     [vertDefinitions, thresholdDefinitions],
//     thresholdPipelineDescriptor
//   );
//   const thresholdBGLayout = device.createBindGroupLayout(
//     thresholdBGLayoutDescriptors[0]
//   );
//   console.log(thresholdBGLayoutDescriptors);
//   console.log(thresholdDefinitions);

//   const sampleBindGroupDefinitions = makeBindGroupLayoutDescriptors(
//     [vertDefinitions, kawaseDefinitions],
//     upSamplePipelineDescriptor
//   );
//   const sampleConstantBGLayout = device.createBindGroupLayout(
//     sampleBindGroupDefinitions[1]
//   );
//   const sampleDynamicBGLayout = device.createBindGroupLayout(
//     sampleBindGroupDefinitions[0]
//   );
//   const thresholdPipelineLayout = device.createPipelineLayout({
//     bindGroupLayouts: [thresholdBGLayout],
//     label: 'thresholdPipelineLayout',
//   });
//   const samplePipelineLayout = device.createPipelineLayout({
//     bindGroupLayouts: [sampleDynamicBGLayout, sampleConstantBGLayout],
//     label: 'samplePipelineLayout',
//   });
//   const thresholdPipeline = doBloom
//     ? device.createRenderPipeline({
//         ...thresholdPipelineDescriptor,
//         layout: thresholdPipelineLayout,
//       })
//     : undefined;
//   const downPipeline = device.createRenderPipeline({
//     ...downSamplePipelineDescriptor,
//     layout: samplePipelineLayout,
//   });
//   const upPipeline = device.createRenderPipeline({
//     ...upSamplePipelineDescriptor,
//     layout: samplePipelineLayout,
//   });
//   const finalPipeline = device.createRenderPipeline({
//     ...finalPipelineDescriptor,
//     layout: samplePipelineLayout,
//   });
//   const thresholdTexture = doBloom
//     ? device.createTexture({
//         format: workingFormat,
//         size: resolution,
//         usage: TexUsage.RENDER_ATTACHMENT | TexUsage.TEXTURE_BINDING,
//         label: 'threshold-texture',
//       })
//     : undefined;
//   const passCount = levels;
//   const downSizedTextures = d3.range(passCount).map((i) => {
//     const width = Math.max(1, resolution[0] / 2 ** i);
//     const height = Math.max(1, resolution[1] / 2 ** i);
//     return device.createTexture({
//       label: `texture-level-${i}`,
//       format: workingFormat,
//       size: { width, height },
//       usage:
//         GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
//     });
//   });
//   const sampler = device.createSampler({
//     magFilter: 'linear',
//     minFilter: 'linear',
//     addressModeU: 'clamp-to-edge',
//     addressModeV: 'clamp-to-edge',
//   });
//   const threshUniBuffer = doBloom
//     ? device.createBuffer({
//         size: thresholdDefinitions.uniforms['u'].size,
//         usage: BufUsage.COPY_DST | BufUsage.UNIFORM,
//         mappedAtCreation: true,
//       })
//     : undefined;
//   type ThreshUniforms = {
//     threshold: number;
//     soft: number;
//   };
//   if (doBloom && threshUniBuffer) {
//     const data = threshUniBuffer.getMappedRange();
//     setStructuredValues(
//       thresholdDefinitions.uniforms['u'],
//       {
//         threshold: 0.99,
//         soft: 0.2,
//       } satisfies ThreshUniforms,
//       data
//     );
//     console.log([...new Float32Array(data)]);

//     threshUniBuffer.unmap();
//   }
//   const threshView = doBloom
//     ? makeStructuredView(thresholdDefinitions.uniforms.u)
//     : undefined;
//   const threshBG = doBloom && threshUniBuffer
//     ? device.createBindGroup({
//         layout: thresholdBGLayout,
//         entries: [
//           {
//             binding: 0,
//             resource: sampler,
//           },
//           {
//             binding: 1,
//             resource: sourceTexture.createView(),
//           },
//           {
//             binding: 2,
//             resource: { buffer: threshUniBuffer },
//           },
//         ],
//       })
//     : undefined;
//   const kawaseConstantUniBuffer = device.createBuffer({
//     usage: BufUsage.COPY_DST | BufUsage.UNIFORM,
//     size: kawaseDefinitions.uniforms.u.size,
//     label: 'blur-constant-buf',
//     mappedAtCreation: true,
//   });
//   type KawaseUniforms = {
//     intensity: number;
//     blurOffset: number;
//   };
//   setStructuredValues(
//     kawaseDefinitions.uniforms.u,
//     {
//       intensity: 1,
//       blurOffset: 1,
//     } satisfies KawaseUniforms,
//     kawaseConstantUniBuffer.getMappedRange()
//   );
//   const blurView = makeStructuredView(kawaseDefinitions.uniforms.u);
//   kawaseConstantUniBuffer.unmap();
//   const kawaseConstantBG = device.createBindGroup({
//     layout: sampleConstantBGLayout,
//     entries: [
//       {
//         binding: 1,
//         resource: sampler,
//       },
//       {
//         binding: 0,
//         resource: sourceTexture.createView(),
//       },
//       {
//         binding: 2,
//         resource: { buffer: kawaseConstantUniBuffer },
//       },
//     ],
//   });
//   const downBGs: GPUBindGroup[] = [];
//   const upBGs: GPUBindGroup[] = [];
//   for (let i = 0; i < passCount; i++) {
//     let downSource: GPUTexture = sourceTexture;
//     if (doBloom && thresholdTexture) downSource = thresholdTexture;
//     if (i > 0) downSource = downSizedTextures[i - 1];
//     const downBuf = device.createBuffer({
//       label: `buffer-down-${i}`,
//       size: 4 * 2,
//       usage: GPUBufferUsage.UNIFORM,
//       mappedAtCreation: true,
//     });
//     let r = new Float32Array(downBuf.getMappedRange(0, 8));
//     r[0] = 0.5 / downSource.width;
//     r[1] = 0.5 / downSource.height;
//     downBuf.unmap();
//     downBGs.push(
//       device.createBindGroup({
//         layout: sampleDynamicBGLayout,
//         entries: [
//           {
//             binding: 0,
//             resource: downSource.createView(),
//           },
//           {
//             binding: 1,
//             resource: { buffer: downBuf },
//           },
//         ],
//       })
//     );
//     const upSource = downSizedTextures[i];
//     const upBuf = device.createBuffer({
//       label: `buffer-up-${i}`,
//       size: 4 * 2,
//       usage: GPUBufferUsage.UNIFORM,
//       mappedAtCreation: true,
//     });
//     r = new Float32Array(upBuf.getMappedRange(0, 8));
//     r[0] = 0.5 / upSource.width;
//     r[1] = 0.5 / upSource.height;
//     upBuf.unmap();
//     upBGs.push(
//       device.createBindGroup({
//         layout: sampleDynamicBGLayout,
//         entries: [
//           {
//             binding: 0,
//             resource: upSource.createView(),
//           },
//           {
//             binding: 1,
//             resource: { buffer: upBuf },
//           },
//         ],
//       })
//     );
//   }

//   return {
//     draw: (target: GPUTexture) => {
//       const enc = device.createCommandEncoder();
//       if (doBloom && thresholdTexture && threshBG && thresholdPipeline) {
//         const pass = enc.beginRenderPass({
//           label: 'thresh-pass',
//           colorAttachments: [
//             {
//               loadOp: 'clear',
//               clearValue: [0, 0, 0, 0],
//               storeOp: 'store',
//               view: thresholdTexture.createView(),
//             },
//           ],
//         });
//         pass.setPipeline(thresholdPipeline);
//         pass.setBindGroup(0, threshBG);
//         pass.draw(6);
//         pass.end();
//       }
//       for (let i = 0; i < passCount; i++) {
//         const pass = enc.beginRenderPass({
//           label: `downsample-${i}`,
//           colorAttachments: [
//             {
//               loadOp: 'clear',
//               clearValue: [0, 0, 0, 0],
//               storeOp: 'store',
//               view: downSizedTextures[i].createView(),
//             },
//           ],
//         });
//         pass.setPipeline(downPipeline);
//         pass.setBindGroup(0, downBGs[i]);
//         pass.setBindGroup(1, kawaseConstantBG);
//         pass.draw(6);
//         pass.end();
//       }

//       for (let i = passCount - 1; i >= 0; i--) {
//         const final = i === 0;
//         const pass = enc.beginRenderPass({
//           label: `upsample-${i}`,
//           colorAttachments: [
//             {
//               loadOp: doBloom ? 'load' : 'clear',
//               clearValue: [0, 0, 0, 0],
//               storeOp: 'store',
//               view: final
//                 ? target.createView()
//                 : downSizedTextures[i - 1].createView(),
//             },
//           ],
//         });
//         pass.setPipeline(final ? finalPipeline : upPipeline);
//         pass.setBindGroup(0, upBGs[i]);
//         pass.setBindGroup(1, kawaseConstantBG);
//         pass.draw(6);
//         pass.end();
//       }

//       return enc.finish();
//     },
//     setUniforms(
//       queue: GPUQueue,
//       uniforms: { blur: KawaseUniforms; threshold?: ThreshUniforms }
//     ) {
//       blurView.set(uniforms.blur);
//       queue.writeBuffer(kawaseConstantUniBuffer, 0, blurView.arrayBuffer);
//       if (uniforms.threshold && threshView && threshUniBuffer) {
//         threshView.set(uniforms.threshold);
//         queue.writeBuffer(threshUniBuffer, 0, threshView.arrayBuffer);
//       }
//     },
//   };
// };
