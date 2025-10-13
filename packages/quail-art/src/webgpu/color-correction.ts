import {
  type ArrayBufferViews,
  makeShaderDataDefinitions,
  makeStructuredView,
} from 'webgpu-utils';
import { createPPPipelineAndLayouts } from './createPipeline.js';
import './setup.js';
import { code } from './shaders/tone-mapping.wgsl';
import { BufUsage } from './usage-enums.js';

const toneMapModule = device.createShaderModule({
  code,
  label: 'tonemap-shader-module',
});
// @enum {number}
const tonemapType = {
  clamp: 0,
  reinhard: 1,
  narkowicz: 2,
  hill: 3,
} as const;
export const tonemapTypes = [
  ...(Object.keys(tonemapType) as Array<keyof typeof tonemapType>),
];
export type UniformObject = {
  whitePoint: number;
  exposure: number;
  contrast: number;
  midPoint: number;
  brightness: number;
  saturation: number;
};
type TypedView<T extends Record<string, unknown>> = ArrayBufferViews & {
  set: (data: Partial<T>) => void;
};

export function createToneMapPass(
  passName: string,
  inputView: GPUTextureView,
  outputFormat: GPUTextureFormat,
  defaultOutputTexture: GPUTextureView | undefined,
  tonemapMethod: keyof typeof tonemapType,
  gammaCorrect = true
) {
  const fragDataDefinitions = makeShaderDataDefinitions(code);
  const uniforms = makeStructuredView(
    fragDataDefinitions.uniforms['u']
  ) as TypedView<UniformObject>;
  uniforms.set({
    whitePoint: 1.0,
    brightness: 0.0,
    contrast: 1.0,
    saturation: 1.0,
    exposure: 1.0,
    midPoint: 0.5,
  });
  const uniformBuffer = device.createBuffer({
    size: uniforms.arrayBuffer.byteLength,
    usage: BufUsage.UNIFORM | BufUsage.COPY_DST,
    label: `uniform-${passName}`,
  });
  const sam = device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: 'linear',
  });
  const { bindGroupLayouts, renderPipeline } = createPPPipelineAndLayouts(
    {
      codeModule: toneMapModule,
      dataDefinition: fragDataDefinitions,
      entry: 'frag',
      constants: {
        hdrType: tonemapType[tonemapMethod],
        gammaCorrect: gammaCorrect ? 1 : 0,
      },
    },
    outputFormat,
    passName
  );
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayouts[0],
    entries: [
      {
        binding: 0,
        resource: sam,
      },
      {
        binding: 1,
        resource: inputView,
      },
      {
        binding: 2,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });
  return {
    setUniforms: (queue: GPUQueue, uniformsToSet: Partial<UniformObject>) => {
      uniforms.set(uniformsToSet);
      queue.writeBuffer(uniformBuffer, 0, uniforms.arrayBuffer, 0);
    },
    renderPass: (enc: GPUCommandEncoder, target?: GPUTextureView) => {
      const pass = enc.beginRenderPass({
        label: `pass-${passName}`,
        colorAttachments: [
          {
            loadOp: 'clear',
            storeOp: 'store',
            view: target ?? defaultOutputTexture,
          },
        ],
      });
      pass.setPipeline(renderPipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
    },
  };
}
